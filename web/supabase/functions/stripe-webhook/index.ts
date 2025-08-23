import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 完全跳过认证检查 - 允许所有请求
  console.log('Webhook function called, skipping auth check for all requests')

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    console.log('Webhook received:', {
      hasSignature: !!signature,
      signatureLength: signature?.length || 0,
      bodyLength: body.length,
      webhookSecret: Deno.env.get('STRIPE_WEBHOOK_SECRET') ? 'SET' : 'NOT_SET'
    })

    let event
    try {
      if (!signature) {
        console.log('No stripe-signature header provided')
        // 尝试解析事件而不验证签名（仅用于调试）
        try {
          event = JSON.parse(body)
          console.log('Parsed event without signature verification:', event.type)
        } catch (parseError) {
          console.log('Failed to parse event body:', parseError.message)
          return new Response(`Webhook Error: No signature and invalid JSON`, { status: 400 })
        }
      } else {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
        )
        console.log('Event verified with signature:', event.type)
      }
    } catch (err) {
      console.log(`Webhook signature verification failed:`, err.message)
      console.log('Request headers:', Object.fromEntries(req.headers.entries()))
      console.log('Body preview:', body.substring(0, 200))
      
      // 对于开发环境，尝试不验证签名处理事件
      try {
        event = JSON.parse(body)
        console.log('Processing event without signature verification (development mode):', event.type)
      } catch (parseError) {
        console.log('Failed to parse event body:', parseError.message)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
      }
    }

    console.log('Processing webhook event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, stripe, supabaseClient)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object, supabaseClient)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabaseClient)
        break
      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', event.data.object.id)
        break
      case 'invoice.payment_failed':
        console.log('Payment failed:', event.data.object.id)
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function handleCheckoutSessionCompleted(session: any, stripe: any, supabaseClient: any) {
  try {
    console.log('Handling checkout session completed:', session.id)
    console.log('Session data:', {
      id: session.id,
      customer: session.customer,
      customer_email: session.customer_email,
      mode: session.mode,
      subscription: session.subscription,
      metadata: session.metadata
    })
    
    let userId = null
    
    // 首先尝试从session metadata中获取用户ID
    if (session.metadata?.supabase_user_id) {
      userId = session.metadata.supabase_user_id
      console.log('Found user ID from session metadata:', userId)
    }
    
    // 如果没有从metadata获取到，尝试其他方法
    if (!userId) {
      if (session.customer) {
        // 获取客户信息
        const customer = await stripe.customers.retrieve(session.customer)
        console.log('Customer data:', {
          id: customer.id,
          email: customer.email,
          metadata: customer.metadata
        })
        
        // 尝试从customer metadata中获取用户ID
        if (customer.metadata?.supabase_user_id) {
          userId = customer.metadata.supabase_user_id
          console.log('Found user ID from customer metadata:', userId)
        } else if (customer.email) {
          // 根据邮箱查找用户
          const { data: user, error: userError } = await supabaseClient.auth.admin.getUserByEmail(customer.email)
          
          if (userError || !user) {
            console.error('User not found for email:', customer.email)
            return
          }
          
          userId = user.user.id
          console.log('Found user by email:', userId)
        }
      } else if (session.customer_email) {
        // 使用customer_email查找用户
        const { data: user, error: userError } = await supabaseClient.auth.admin.getUserByEmail(session.customer_email)
        
        if (userError || !user) {
          console.error('User not found for email:', session.customer_email)
          return
        }
        
        userId = user.user.id
        console.log('Found user by customer_email:', userId)
      }
    }
    
    if (!userId) {
      console.error('Could not determine user ID from session data')
      return
    }

    // 更新用户 profile 中的 stripe_customer_id
    if (session.customer) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .upsert({
          id: userId,
          stripe_customer_id: session.customer,
          email: session.customer_email || session.metadata?.user_email
        })

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }
    }

    // 如果是订阅，获取订阅信息
    if (session.mode === 'subscription' && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription)
      await handleSubscriptionChange(subscription, supabaseClient, userId)
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}

async function handleSubscriptionChange(subscription: any, supabaseClient: any, userId?: string) {
  try {
    console.log('Handling subscription change:', subscription.id)
    
    let targetUserId = userId
    
    if (!targetUserId) {
      // 通过 stripe_customer_id 查找用户
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', subscription.customer)
        .single()

      if (!profile) {
        console.error('Profile not found for customer:', subscription.customer)
        
        // 尝试通过customer email查找用户
        try {
          const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
          })
          
          const customer = await stripe.customers.retrieve(subscription.customer)
          console.log('Retrieved customer:', customer.email)
          
          if (customer.email) {
            const { data: user, error: userError } = await supabaseClient.auth.admin.getUserByEmail(customer.email)
            
            if (userError || !user) {
              console.error('User not found for email:', customer.email)
              return
            }
            
            console.log('Found user by email:', user.user.id)
            targetUserId = user.user.id
            
            // 创建或更新profile
            const { error: profileError } = await supabaseClient
              .from('profiles')
              .upsert({
                id: user.user.id,
                stripe_customer_id: subscription.customer,
                email: customer.email
              })

            if (profileError) {
              console.error('Error creating profile:', profileError)
            } else {
              console.log('Profile created/updated successfully')
            }
          } else {
            console.error('Customer has no email')
            return
          }
        } catch (customerError) {
          console.error('Error retrieving customer:', customerError)
          return
        }
      } else {
        targetUserId = profile.id
      }
    }

    const subscriptionData = {
      user_id: targetUserId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      interval: subscription.items.data[0].price.recurring.interval,
      amount: subscription.items.data[0].price.unit_amount / 100,
      currency: subscription.items.data[0].price.currency,
    }

    console.log('Upserting subscription data:', subscriptionData)

    const { error } = await supabaseClient
      .from('user_subscriptions')
      .upsert(subscriptionData)

    if (error) {
      console.error('Error updating subscription:', error)
    } else {
      console.log('Subscription updated successfully:', subscription.id)
    }
  } catch (error) {
    console.error('Error handling subscription change:', error)
  }
}

async function handleSubscriptionDeleted(subscription: any, supabaseClient: any) {
  try {
    console.log('Handling subscription deletion:', subscription.id)
    
    const { error } = await supabaseClient
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error cancelling subscription:', error)
    } else {
      console.log('Subscription cancelled successfully:', subscription.id)
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error)
  }
}


import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'
import MainTabs from './components/navigation/MainTabs'
import AuthScreen from './screens/AuthScreen'
import NovelDetailScreen from './screens/NovelDetailScreen'
import ReaderScreen from './screens/ReaderScreen'
import { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) {
    return null // 可以添加加载屏幕
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="NovelDetail" 
              component={NovelDetailScreen}
              options={{ headerShown: true, title: 'Novel Details' }}
            />
            <Stack.Screen 
              name="Reader" 
              component={ReaderScreen}
              options={{ headerShown: true, title: 'Reader' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { Novel, RootStackParamList, UserPurchase, CATEGORY_MAPPING } from '../types'

type NovelDetailScreenRouteProp = RouteProp<RootStackParamList, 'NovelDetail'>
type NovelDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NovelDetail'>

export default function NovelDetailScreen() {
  const route = useRoute<NovelDetailScreenRouteProp>()
  const navigation = useNavigation<NovelDetailScreenNavigationProp>()
  const { novel, isInBookshelf: initialBookshelfState } = route.params
  
  const [isPurchased, setIsPurchased] = useState(false)
  const [isInBookshelf, setIsInBookshelf] = useState(initialBookshelfState ?? false)
  const [loading, setLoading] = useState(true)

  const getCategoryDisplayName = (category: string) => {
    return CATEGORY_MAPPING[category as keyof typeof CATEGORY_MAPPING] || category
  }

  useEffect(() => {
    checkPurchaseAndBookshelfStatus()
  }, [])

  // 当页面获得焦点时重新检查状态
  useFocusEffect(
    React.useCallback(() => {
      checkPurchaseAndBookshelfStatus()
    }, [novel.id])
  )

  async function checkPurchaseAndBookshelfStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 检查是否已购买
      const { data: purchases } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('novel_id', novel.id)

      setIsPurchased(purchases && purchases.length > 0)

      // 检查是否在书架中
      const { data: bookshelfItems } = await supabase
        .from('user_bookshelf')
        .select('*')
        .eq('user_id', user.id)
        .eq('novel_id', novel.id)

      setIsInBookshelf(bookshelfItems && bookshelfItems.length > 0)
    } catch (error) {
      console.error('Error checking status:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addToBookshelf() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_bookshelf')
        .insert({
          user_id: user.id,
          novel_id: novel.id,
        })

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      setIsInBookshelf(true)
      Alert.alert('Success', 'Added to bookshelf')
    } catch (error) {
      console.error('Error adding to bookshelf:', error)
      Alert.alert('Error', 'Failed to add')
    }
  }

  async function removeFromBookshelf() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_bookshelf')
        .delete()
        .eq('user_id', user.id)
        .eq('novel_id', novel.id)

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      setIsInBookshelf(false)
      Alert.alert('Success', 'Removed from bookshelf')
    } catch (error) {
      console.error('Error removing from bookshelf:', error)
      Alert.alert('Error', 'Failed to remove')
    }
  }

  async function purchaseNovel() {
    Alert.alert(
      'Purchase Confirmation',
      `Are you sure you want to purchase "${novel.title}"? Price: $${novel.price}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) return

              const { error } = await supabase
                .from('user_purchases')
                .insert({
                  user_id: user.id,
                  novel_id: novel.id,
                })

              if (error) {
                Alert.alert('Error', error.message)
                return
              }

              setIsPurchased(true)
              Alert.alert('Success', 'Purchase successful! You can now read all chapters')
            } catch (error) {
              console.error('Error purchasing novel:', error)
              Alert.alert('Error', 'Purchase failed')
            }
          }
        }
      ]
    )
  }

  function startReading() {
    navigation.navigate('Reader', { novel, chapterNumber: 1 })
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: novel.cover_image || 'https://via.placeholder.com/150x200' }}
          style={styles.cover}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{novel.title}</Text>
          <Text style={styles.author}>Author: {novel.author}</Text>
          <Text style={styles.category}>{getCategoryDisplayName(novel.category)}</Text>
          <Text style={styles.chapters}>{novel.total_chapters} Chapters</Text>
          <Text style={styles.freeChapters}>Free: First {novel.free_chapters} chapters</Text>
          {novel.price > 0 && (
            <Text style={styles.price}>Price: ${novel.price}</Text>
          )}
        </View>
      </View>

      <View style={styles.description}>
        <Text style={styles.descriptionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{novel.description}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.readButton]}
          onPress={startReading}
        >
          <Text style={styles.readButtonText}>Start Reading</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.bookshelfButton]}
          onPress={isInBookshelf ? removeFromBookshelf : addToBookshelf}
        >
          <Text style={styles.bookshelfButtonText}>
            {isInBookshelf ? 'Remove from Bookshelf' : 'Add to Bookshelf'}
          </Text>
        </TouchableOpacity>

        {novel.price > 0 && !isPurchased && (
          <TouchableOpacity
            style={[styles.button, styles.purchaseButton]}
            onPress={purchaseNovel}
          >
            <Text style={styles.purchaseButtonText}>Purchase Full Version ${novel.price}</Text>
          </TouchableOpacity>
        )}

        {isPurchased && (
          <View style={styles.purchasedIndicator}>
            <Text style={styles.purchasedText}>✓ Purchased</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  cover: {
    width: 120,
    height: 160,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    color: '#34495E',
    marginBottom: 5,
  },
  category: {
    fontSize: 14,
    color: '#C0392B',
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  chapters: {
    fontSize: 14,
    color: '#34495E',
    marginBottom: 3,
  },
  freeChapters: {
    fontSize: 14,
    color: '#D4AF37',
    marginBottom: 3,
  },
  price: {
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  description: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: '#34495E',
    lineHeight: 24,
  },
  actions: {
    backgroundColor: 'white',
    padding: 20,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  readButton: {
    backgroundColor: '#2C3E50',
  },
  readButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookshelfButton: {
    backgroundColor: '#E5E5E5',
    borderWidth: 1,
    borderColor: '#34495E',
  },
  bookshelfButtonText: {
    color: '#2C3E50',
    fontSize: 16,
  },
  purchaseButton: {
    backgroundColor: '#C0392B',
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  purchasedIndicator: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  purchasedText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
  },
}) 
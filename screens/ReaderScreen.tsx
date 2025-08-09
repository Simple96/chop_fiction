import React, { useEffect, useState, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { Chapter, RootStackParamList } from '../types'

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>
type ReaderScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Reader'>

export default function ReaderScreen() {
  const route = useRoute<ReaderScreenRouteProp>()
  const navigation = useNavigation<ReaderScreenNavigationProp>()
  const { novel, chapterNumber } = route.params
  
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [isPurchased, setIsPurchased] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    loadChapter()
    checkPurchaseStatus()
    updateReadingProgress()
    // 滚动到页面顶部
    scrollViewRef.current?.scrollTo({ y: 0, animated: false })
  }, [chapterNumber])

  async function loadChapter() {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novel.id)
        .eq('chapter_number', chapterNumber)
        .single()

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      setCurrentChapter(data)
    } catch (error) {
      console.error('Error loading chapter:', error)
    } finally {
      setLoading(false)
    }
  }

  async function checkPurchaseStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('novel_id', novel.id)
        .single()

      setIsPurchased(!!data)
    } catch (error) {
      console.error('Error checking purchase status:', error)
    }
  }

  async function updateReadingProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_bookshelf')
        .upsert({
          user_id: user.id,
          novel_id: novel.id,
          last_read_chapter: chapterNumber,
        }, {
          onConflict: 'user_id,novel_id'
        })

      if (error) {
        console.error('Error updating reading progress:', error)
      }
    } catch (error) {
      console.error('Error updating reading progress:', error)
    }
  }

  async function purchaseNovel() {
    Alert.alert(
      'Purchase Required',
      `You need to purchase "${novel.title}" to continue reading. Price: $${novel.price}`,
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

  function goToPreviousChapter() {
    if (chapterNumber > 1) {
      navigation.setParams({ chapterNumber: chapterNumber - 1 })
    }
  }

  function goToNextChapter() {
    const canRead = chapterNumber < novel.free_chapters || isPurchased
    
    if (!canRead) {
      purchaseNovel()
      return
    }

    if (chapterNumber < novel.total_chapters) {
      navigation.setParams({ chapterNumber: chapterNumber + 1 })
    }
  }

  const isChapterLocked = chapterNumber > novel.free_chapters && !isPurchased

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    )
  }

  if (!currentChapter) {
    return (
      <View style={styles.centerContainer}>
        <Text>Chapter not found</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.novelTitle}>{novel.title}</Text>
        <Text style={styles.chapterTitle}>{currentChapter.title}</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
      >
        {isChapterLocked ? (
          <View style={styles.lockedContent}>
            <Text style={styles.lockedTitle}>This chapter requires purchase</Text>
            <Text style={styles.lockedDescription}>
              Free chapters: First {novel.free_chapters} chapters{'\n'}
              Current chapter: Chapter {chapterNumber}
            </Text>
            <TouchableOpacity style={styles.purchaseButton} onPress={purchaseNovel}>
              <Text style={styles.purchaseButtonText}>Purchase Full Version ${novel.price}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.chapterContent}>{currentChapter.content}</Text>
        )}
      </ScrollView>

      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, chapterNumber <= 1 && styles.disabledButton]}
          onPress={goToPreviousChapter}
          disabled={chapterNumber <= 1}
        >
          <Text style={[styles.navButtonText, chapterNumber <= 1 && styles.disabledButtonText]}>
            Previous
          </Text>
        </TouchableOpacity>

        <Text style={styles.chapterInfo}>
          {chapterNumber} / {novel.total_chapters}
        </Text>

        <TouchableOpacity
          style={[styles.navButton, chapterNumber >= novel.total_chapters && styles.disabledButton]}
          onPress={goToNextChapter}
          disabled={chapterNumber >= novel.total_chapters}
        >
          <Text style={[styles.navButtonText, chapterNumber >= novel.total_chapters && styles.disabledButtonText]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  novelTitle: {
    fontSize: 16,
    color: '#34495E',
    marginBottom: 5,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  chapterContent: {
    fontSize: 18,
    lineHeight: 32,
    color: '#2C3E50',
    textAlign: 'justify',
  },
  lockedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  lockedDescription: {
    fontSize: 16,
    color: '#34495E',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  purchaseButton: {
    backgroundColor: '#C0392B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2C3E50',
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#E5E5E5',
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButtonText: {
    color: '#34495E',
  },
  chapterInfo: {
    fontSize: 16,
    color: '#34495E',
  },
}) 
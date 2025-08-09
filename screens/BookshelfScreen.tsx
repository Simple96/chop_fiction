import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { BookshelfItem, Novel, RootStackParamList, CATEGORY_MAPPING } from '../types'

type BookshelfScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

export default function BookshelfScreen() {
  const [bookshelfItems, setBookshelfItems] = useState<BookshelfItem[]>([])
  const [loading, setLoading] = useState(true)
  const navigation = useNavigation<BookshelfScreenNavigationProp>()

  const getCategoryDisplayName = (category: string) => {
    return CATEGORY_MAPPING[category as keyof typeof CATEGORY_MAPPING] || category
  }

  useEffect(() => {
    loadBookshelf()
  }, [])

  // 当页面获得焦点时重新加载书架数据
  useFocusEffect(
    React.useCallback(() => {
      loadBookshelf()
    }, [])
  )

  async function loadBookshelf() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_bookshelf')
        .select(`
          *,
          novel:novels(*)
        `)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      setBookshelfItems(data || [])
    } catch (error) {
      console.error('Error loading bookshelf:', error)
    } finally {
      setLoading(false)
    }
  }

  function renderBookItem({ item }: { item: BookshelfItem }) {
    const novel = item.novel as Novel
    if (!novel) return null

    return (
      <TouchableOpacity
        style={styles.bookItem}
        onPress={() => navigation.navigate('NovelDetail', { novel, isInBookshelf: true })}
      >
        <Image
          source={{ uri: novel.cover_image || 'https://via.placeholder.com/100x150' }}
          style={styles.bookCover}
        />
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>{novel.title}</Text>
          <Text style={styles.bookAuthor}>{novel.author}</Text>
          <Text style={styles.bookProgress}>
            {item.last_read_chapter ? `Read to Chapter ${item.last_read_chapter}` : 'Not started'}
          </Text>
          <Text style={styles.bookCategory}>{getCategoryDisplayName(novel.category)}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    )
  }

  if (bookshelfItems.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Your bookshelf is empty</Text>
        <Text style={styles.emptySubText}>Discover some great books in the Discover tab</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookshelfItems}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
    padding: 20,
  },
  listContainer: {
    padding: 15,
  },
  bookItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#34495E',
    marginBottom: 5,
  },
  bookProgress: {
    fontSize: 14,
    color: '#C0392B',
    marginBottom: 5,
  },
  bookCategory: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  emptyText: {
    fontSize: 18,
    color: '#2C3E50',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#34495E',
  },
}) 
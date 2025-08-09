import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { Novel, RootStackParamList, CATEGORIES, Category, CATEGORY_MAPPING } from '../types'

type CategoriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

export default function CategoriesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('Fantasy')
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const navigation = useNavigation<CategoriesScreenNavigationProp>()

  const getCategoryDisplayName = (category: string) => {
    return CATEGORY_MAPPING[category as keyof typeof CATEGORY_MAPPING] || category
  }

  useEffect(() => {
    loadNovelsByCategory(selectedCategory)
  }, [selectedCategory])

  async function loadNovelsByCategory(category: Category) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('novels')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.log('Using mock data for category:', category)
        // 使用模拟数据
        const mockNovels = [
          {
            id: `${category}-1`,
            title: `${category}小说示例1`,
            author: '作者1',
            description: `这是一本${category}类型的AI缩写小说示例。内容精彩，情节紧凑，适合快速阅读。`,
            cover_image: 'https://via.placeholder.com/100x150',
            category: category,
            original_language: 'zh-CN',
            translated_language: 'en',
            total_chapters: 30,
            free_chapters: 8,
            price: 6.99,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: `${category}-2`,
            title: `${category}小说示例2`,
            author: '作者2',
            description: `另一本精彩的${category}类型AI缩写小说。故事引人入胜，值得一读。`,
            cover_image: 'https://via.placeholder.com/100x150',
            category: category,
            original_language: 'zh-CN',
            translated_language: 'en',
            total_chapters: 25,
            free_chapters: 6,
            price: 5.99,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
        setNovels(mockNovels)
        return
      }

      setNovels(data || [])
    } catch (error) {
      console.error('Error loading novels by category:', error)
      setNovels([])
    } finally {
      setLoading(false)
    }
  }

  function renderCategoryItem({ item }: { item: Category }) {
    const isSelected = item === selectedCategory
    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.selectedCategoryItem]}
        onPress={() => setSelectedCategory(item)}
      >
        <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
          {item}
        </Text>
      </TouchableOpacity>
    )
  }

  function renderNovelItem({ item }: { item: Novel }) {
    return (
      <TouchableOpacity
        style={styles.novelItem}
        onPress={() => navigation.navigate('NovelDetail', { novel: item, isInBookshelf: false })}
      >
        <Image
          source={{ uri: item.cover_image || 'https://via.placeholder.com/100x150' }}
          style={styles.novelCover}
        />
        <View style={styles.novelInfo}>
          <Text style={styles.novelTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.novelAuthor}>{item.author}</Text>
          <Text style={styles.novelDescription} numberOfLines={2}>{item.description}</Text>
          <View style={styles.novelMeta}>
            <Text style={styles.novelChapters}>{item.total_chapters} chapters</Text>
            {item.price > 0 && (
              <Text style={styles.novelPrice}>${item.price}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>
      
      <View style={styles.novelsContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text>Loading...</Text>
          </View>
        ) : novels.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No content in this category</Text>
            <Text style={styles.emptySubText}>Please select another category</Text>
          </View>
        ) : (
          <FlatList
            data={novels}
            renderItem={renderNovelItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.novelsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  categoriesContainer: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoriesList: {
    paddingHorizontal: 15,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedCategoryItem: {
    backgroundColor: '#2C3E50',
  },
  categoryText: {
    fontSize: 14,
    color: '#34495E',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: 'white',
  },
  novelsContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  novelsList: {
    padding: 15,
  },
  novelItem: {
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
  novelCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  novelInfo: {
    flex: 1,
    marginLeft: 15,
  },
  novelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  novelAuthor: {
    fontSize: 14,
    color: '#34495E',
    marginBottom: 8,
  },
  novelDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    marginBottom: 10,
  },
  novelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  novelChapters: {
    fontSize: 12,
    color: '#34495E',
    marginRight: 15,
  },
  novelPrice: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: 'bold',
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
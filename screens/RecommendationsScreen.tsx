import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { Novel, RootStackParamList, CATEGORY_MAPPING } from '../types'

type RecommendationsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

export default function RecommendationsScreen() {
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const navigation = useNavigation<RecommendationsScreenNavigationProp>()

  const getCategoryDisplayName = (category: string) => {
    return CATEGORY_MAPPING[category as keyof typeof CATEGORY_MAPPING] || category
  }

  useEffect(() => {
    loadRecommendations()
  }, [])

  async function loadRecommendations() {
    try {
      // 尝试从数据库加载，如果失败则使用模拟数据
      const { data, error } = await supabase
        .from('novels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.log('Using mock data due to error:', error.message)
        // 使用模拟数据
        const mockNovels = [
          {
            id: '1',
            title: '斗破苍穹（缩写版）',
            author: '天蚕土豆',
            description: '少年萧炎在家族中被视为废物，但在获得神秘戒指后开始崛起。这是原版小说的AI缩写版本，保留了精彩剧情的同时大大缩短了篇幅。',
            cover_image: 'https://via.placeholder.com/100x150',
            category: '玄幻',
            original_language: 'zh-CN',
            translated_language: 'en',
            total_chapters: 50,
            free_chapters: 12,
            price: 9.99,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            title: '完美世界（缩写版）',
            author: '辰东',
            description: '一个少年从大荒中走出，踏上修炼之路。AI精心缩写，将数百万字的内容压缩为精华版本。',
            cover_image: 'https://via.placeholder.com/100x150',
            category: '玄幻',
            original_language: 'zh-CN',
            translated_language: 'en',
            total_chapters: 45,
            free_chapters: 11,
            price: 8.99,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            title: '凡人修仙传（缩写版）',
            author: '忘语',
            description: '一个普通的山村穷小子，偶然之下，跨入到一个江湖小门派。AI智能缩写，让你快速体验修仙之路。',
            cover_image: 'https://via.placeholder.com/100x150',
            category: '仙侠',
            original_language: 'zh-CN',
            translated_language: 'en',
            total_chapters: 40,
            free_chapters: 10,
            price: 7.99,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
        setNovels(mockNovels)
        return
      }

      setNovels(data || [])
    } catch (error) {
      console.error('Error loading recommendations:', error)
      // 如果完全失败，也使用模拟数据
      setNovels([])
    } finally {
      setLoading(false)
    }
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
          <Text style={styles.novelDescription} numberOfLines={3}>{item.description}</Text>
          <View style={styles.novelMeta}>
                         <Text style={styles.novelCategory}>{getCategoryDisplayName(item.category)}</Text>
            <Text style={styles.novelChapters}>{item.total_chapters} chapters</Text>
            {item.price > 0 && (
              <Text style={styles.novelPrice}>${item.price}</Text>
            )}
          </View>
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

  if (novels.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No recommendations available</Text>
        <Text style={styles.emptySubText}>Please try again later</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={novels}
        renderItem={renderNovelItem}
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
    fontSize: 18,
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
    flexWrap: 'wrap',
  },
  novelCategory: {
    fontSize: 12,
    color: '#C0392B',
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  novelChapters: {
    fontSize: 12,
    color: '#34495E',
    marginRight: 8,
    marginBottom: 4,
  },
  novelPrice: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: 'bold',
    marginBottom: 4,
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
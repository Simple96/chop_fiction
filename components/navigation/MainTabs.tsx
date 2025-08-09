import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import BookshelfScreen from '../../screens/BookshelfScreen'
import RecommendationsScreen from '../../screens/RecommendationsScreen'
import CategoriesScreen from '../../screens/CategoriesScreen'
import ProfileScreen from '../../screens/ProfileScreen'
import { MainTabParamList } from '../../types'

const Tab = createBottomTabNavigator<MainTabParamList>()

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          switch (route.name) {
            case 'Bookshelf':
              iconName = focused ? 'library' : 'library-outline'
              break
            case 'Recommendations':
              iconName = focused ? 'star' : 'star-outline'
              break
            case 'Categories':
              iconName = focused ? 'grid' : 'grid-outline'
              break
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline'
              break
            default:
              iconName = 'ellipse'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#C0392B',
        tabBarInactiveTintColor: '#34495E',
        headerShown: true,
      })}
    >
      <Tab.Screen 
        name="Bookshelf" 
        component={BookshelfScreen}
        options={{ title: 'Bookshelf' }}
      />
      <Tab.Screen 
        name="Recommendations" 
        component={RecommendationsScreen}
        options={{ title: 'Discover' }}
      />
      <Tab.Screen 
        name="Categories" 
        component={CategoriesScreen}
        options={{ title: 'Categories' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  )
} 
#!/usr/bin/env python3
"""
小说上传脚本
使用这个脚本可以交互式地添加新小说到数据库
"""

import os
from supabase import create_client, Client

# 配置你的Supabase连接信息
SUPABASE_URL = "https://bbohqxwziavcqiwmcitw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib2hxeHd6aWF2Y3Fpd21jaXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDE3NDEsImV4cCI6MjA3MDA3Nzc0MX0.8MepqIP2eLmK6-TNw2JUGqobV_z0IIM9mZZi7kAvYOs"

# 可用的类别
CATEGORIES = [
    'Fantasy', 'Urban', 'Xianxia', 'Historical', 'Military', 
    'Gaming', 'Sports', 'Sci-Fi', 'Supernatural', 'Fanfiction'
]

def main():
    print("📚 小说上传工具")
    print("=" * 50)
    
    # 创建Supabase客户端
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    while True:
        print("\n请输入小说信息：")
        
        # 收集小说信息
        title = input("📖 小说标题: ").strip()
        if not title:
            print("标题不能为空！")
            continue
            
        author = input("✍️ 作者: ").strip()
        if not author:
            print("作者不能为空！")
            continue
            
        description = input("📝 简介: ").strip()
        if not description:
            print("简介不能为空！")
            continue
        
        # 显示可用类别
        print("\n📂 可用类别:")
        for i, cat in enumerate(CATEGORIES, 1):
            print(f"  {i}. {cat}")
        
        try:
            cat_choice = int(input("选择类别 (输入数字): ").strip())
            if 1 <= cat_choice <= len(CATEGORIES):
                category = CATEGORIES[cat_choice - 1]
            else:
                print("无效选择，使用默认类别 Fantasy")
                category = 'Fantasy'
        except ValueError:
            print("无效输入，使用默认类别 Fantasy")
            category = 'Fantasy'
        
        # 封面图片URL (可选)
        cover_image = input("🖼️ 封面图片URL (回车跳过): ").strip()
        if not cover_image:
            cover_image = "https://via.placeholder.com/300x400"
        
        # 章节信息
        try:
            total_chapters = int(input("📄 总章节数: ").strip())
            free_chapters = int(input("🆓 免费章节数: ").strip())
            price = float(input("💰 价格 ($): ").strip())
        except ValueError:
            print("数字格式错误，使用默认值")
            total_chapters = 30
            free_chapters = 8
            price = 6.99
        
        # 确认信息
        print(f"\n✅ 小说信息确认:")
        print(f"标题: {title}")
        print(f"作者: {author}")
        print(f"类别: {category}")
        print(f"总章节: {total_chapters}")
        print(f"免费章节: {free_chapters}")
        print(f"价格: ${price}")
        print(f"简介: {description[:100]}{'...' if len(description) > 100 else ''}")
        
        confirm = input("\n确认添加这本小说吗？ (y/n): ").strip().lower()
        if confirm != 'y':
            print("❌ 已取消")
            continue
        
        # 插入数据库
        try:
            result = supabase.table('novels').insert({
                'title': title,
                'author': author,
                'description': description,
                'cover_image': cover_image,
                'category': category,
                'original_language': 'zh-CN',
                'translated_language': 'en',
                'total_chapters': total_chapters,
                'free_chapters': free_chapters,
                'price': price
            }).execute()
            
            if result.data:
                print(f"🎉 成功添加小说: {title}")
                print(f"📍 小说ID: {result.data[0]['id']}")
            else:
                print("❌ 添加失败")
                
        except Exception as e:
            print(f"❌ 错误: {e}")
        
        # 询问是否继续
        another = input("\n是否继续添加小说？ (y/n): ").strip().lower()
        if another != 'y':
            break
    
    print("\n👋 再见！")

if __name__ == "__main__":
    print("💡 提示: 请先安装依赖: pip install supabase")
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 程序已退出")
    except ImportError:
        print("❌ 错误: 请先安装 supabase 库")
        print("运行: pip install supabase")
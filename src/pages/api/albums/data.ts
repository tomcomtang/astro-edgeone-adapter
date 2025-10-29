/**
 * 相册数据存储
 * 
 * 这个文件包含相册的模拟数据，实际项目中应该使用数据库
 */

// 相册类型定义
export interface Album {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  viewUrl?: string;
  downloadUrl?: string;
  category: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 模拟相册数据存储
export const albums: Album[] = [
  {
    id: '1',
    title: '城市夜景摄影',
    description: '捕捉城市夜晚的璀璨灯光和建筑轮廓，展现现代都市的繁华与魅力。包含多个城市的标志性建筑和天际线。',
    image: 'assets/blog-placeholder-1.jpg',
    tags: ['夜景', '城市', '建筑', '灯光'],
    viewUrl: 'https://example.com/albums/city-night',
    downloadUrl: 'https://example.com/download/city-night',
    category: '城市摄影',
    featured: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    title: '自然风光集锦',
    description: '记录大自然的壮丽景色，从山川河流到森林草原，展现地球的原始之美和生态多样性。',
    image: 'assets/blog-placeholder-2.jpg',
    tags: ['自然', '风景', '山川', '生态'],
    viewUrl: 'https://example.com/albums/nature',
    downloadUrl: 'https://example.com/download/nature',
    category: '自然摄影',
    featured: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: '3',
    title: '人像摄影作品',
    description: '专注于人物表情和情感表达的人像摄影，通过光影和构图展现人物的内在美和个性魅力。',
    image: 'assets/blog-placeholder-3.jpg',
    tags: ['人像', '表情', '情感', '光影'],
    viewUrl: 'https://example.com/albums/portrait',
    downloadUrl: 'https://example.com/download/portrait',
    category: '人像摄影',
    featured: false,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '4',
    title: '建筑艺术摄影',
    description: '探索建筑的结构美学和空间设计，从古典建筑到现代摩天大楼，展现人类建筑的智慧与创造力。',
    image: 'assets/blog-placeholder-4.jpg',
    tags: ['建筑', '结构', '设计', '空间'],
    viewUrl: 'https://example.com/albums/architecture',
    downloadUrl: 'https://example.com/download/architecture',
    category: '建筑摄影',
    featured: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-12')
  },
  {
    id: '5',
    title: '微距摄影探索',
    description: '深入微观世界，捕捉昆虫、植物和日常物品的细节之美，展现肉眼难以察觉的奇妙世界。',
    image: 'assets/blog-placeholder-5.jpg',
    tags: ['微距', '细节', '昆虫', '植物'],
    viewUrl: 'https://example.com/albums/macro',
    downloadUrl: 'https://example.com/download/macro',
    category: '微距摄影',
    featured: false,
    createdAt: new Date('2023-12-28'),
    updatedAt: new Date('2024-01-08')
  },
  {
    id: '6',
    title: '黑白摄影艺术',
    description: '回归摄影的本质，通过黑白影像展现光影的对比和层次，创造具有强烈艺术感染力的作品。',
    image: 'assets/blog-placeholder-about.jpg',
    tags: ['黑白', '光影', '对比', '艺术'],
    viewUrl: 'https://example.com/albums/black-white',
    downloadUrl: 'https://example.com/download/black-white',
    category: '艺术摄影',
    featured: false,
    createdAt: new Date('2023-12-20'),
    updatedAt: new Date('2024-01-05')
  }
];

/**
 * 获取所有相册
 */
export async function getAllAlbums(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const featured = url.searchParams.get('featured');
  const limit = url.searchParams.get('limit');
  const offset = url.searchParams.get('offset');

  let filteredAlbums = [...albums];

  // 按分类筛选
  if (category && category !== 'all') {
    filteredAlbums = filteredAlbums.filter(album => 
      album.category.toLowerCase() === category.toLowerCase()
    );
  }

  // 按精选筛选
  if (featured === 'true') {
    filteredAlbums = filteredAlbums.filter(album => album.featured);
  }

  // 排序（精选优先，然后按更新时间）
  filteredAlbums.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  // 分页
  const startIndex = offset ? parseInt(offset) : 0;
  const endIndex = limit ? startIndex + parseInt(limit) : filteredAlbums.length;
  const paginatedAlbums = filteredAlbums.slice(startIndex, endIndex);

  return {
    success: true,
    data: {
      albums: paginatedAlbums,
      total: filteredAlbums.length,
      hasMore: endIndex < filteredAlbums.length
    }
  };
}

/**
 * 获取单个相册详情
 */
export async function getAlbumById(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return {
      success: false,
      message: 'Album ID is required'
    };
  }

  const album = albums.find(a => a.id === id);

  if (!album) {
    return {
      success: false,
      message: 'Album not found'
    };
  }

  return {
    success: true,
    data: { album }
  };
}

/**
 * 创建新相册
 */
export async function createAlbum(request: Request) {
  try {
    const body = await request.json();
    const { title, description, image, tags, viewUrl, downloadUrl, category, featured } = body;

    // 验证必填字段
    if (!title || !description || !category) {
      return {
        success: false,
        message: 'Title, description, and category are required'
      };
    }

    const newAlbum = {
      id: (albums.length + 1).toString(),
      title,
      description,
      image: image || 'blog-placeholder-about.jpg',
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
      viewUrl,
      downloadUrl,
      category,
      featured: featured === 'true' || featured === true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    albums.push(newAlbum);

    return {
      success: true,
      data: { album: newAlbum },
      message: 'Album created successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Invalid request body'
    };
  }
}

/**
 * 更新相册
 */
export async function updateAlbum(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return {
        success: false,
        message: 'Album ID is required'
      };
    }

    const albumIndex = albums.findIndex(a => a.id === id);

    if (albumIndex === -1) {
      return {
        success: false,
        message: 'Album not found'
      };
    }

    const { title, description, image, tags, viewUrl, downloadUrl, category, featured } = body;

    albums[albumIndex] = {
      ...albums[albumIndex],
      title: title || albums[albumIndex].title,
      description: description || albums[albumIndex].description,
      image: image || albums[albumIndex].image,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : albums[albumIndex].tags,
      viewUrl: viewUrl !== undefined ? viewUrl : albums[albumIndex].viewUrl,
      downloadUrl: downloadUrl !== undefined ? downloadUrl : albums[albumIndex].downloadUrl,
      category: category || albums[albumIndex].category,
      featured: featured !== undefined ? (featured === 'true' || featured === true) : albums[albumIndex].featured,
      updatedAt: new Date()
    };

    return {
      success: true,
      data: { album: albums[albumIndex] },
      message: 'Album updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Invalid request body'
    };
  }
}

/**
 * 删除相册
 */
export async function deleteAlbum(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return {
      success: false,
      message: 'Album ID is required'
    };
  }

  const albumIndex = albums.findIndex(a => a.id === id);

  if (albumIndex === -1) {
    return {
      success: false,
      message: 'Album not found'
    };
  }

  albums.splice(albumIndex, 1);

  return {
    success: true,
    message: 'Album deleted successfully'
  };
}

/**
 * 获取相册分类列表
 */
export async function getAlbumCategories() {
  const categories = [...new Set(albums.map(album => album.category))];
  
  return {
    success: true,
    data: { categories }
  };
}

/**
 * Actions 示例 - 用户管理相关接口
 * 
 * 这个文件展示了如何在 Astro EdgeOne 适配器中实现 Actions
 */

// 模拟用户数据存储（实际项目中应该使用数据库）
const users: Array<{
  id: string;
  username: string;
  email: string;
  password: string; // 实际项目中应该加密存储
  createdAt: Date;
}> = [];

// 生成简单的 JWT token（实际项目中应该使用专业的 JWT 库）
function generateToken(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    userId, 
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24小时过期
  }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
}

// 验证 JWT token
function verifyToken(token: string): { userId: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Date.now()) return null;
    
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

/**
 * 用户注册 Action
 */
export async function registerUser(formData: FormData) {
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  // 输入验证
  if (!username || !email || !password) {
    return {
      success: false,
      error: 'Missing required fields: username, email, password'
    };
  }
  
  // 检查邮箱是否已存在
  if (users.find(user => user.email === email)) {
    return {
      success: false,
      error: 'Email already exists'
    };
  }
  
  // 检查用户名是否已存在
  if (users.find(user => user.username === username)) {
    return {
      success: false,
      error: 'Username already exists'
    };
  }
  
  // 创建新用户
  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    username,
    email,
    password, // 实际项目中应该加密
    createdAt: new Date()
  };
  
  users.push(newUser);
  
  return {
    success: true,
    message: 'User registered successfully',
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt
    }
  };
}

/**
 * 用户登录 Action
 */
export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  // 输入验证
  if (!email || !password) {
    return {
      success: false,
      error: 'Missing required fields: email, password'
    };
  }
  
  // 查找用户
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return {
      success: false,
      error: 'Invalid email or password'
    };
  }
  
  // 生成 token
  const token = generateToken(user.id);
  
  return {
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }
  };
}

/**
 * 获取用户信息 Action
 */
export async function getUserProfile(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid authorization header'
    };
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return {
      success: false,
      error: 'Invalid or expired token'
    };
  }
  
  const user = users.find(u => u.id === decoded.userId);
  
  if (!user) {
    return {
      success: false,
      error: 'User not found'
    };
  }
  
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }
  };
}

/**
 * 更新用户信息 Action
 */
export async function updateUserProfile(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid authorization header'
    };
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return {
      success: false,
      error: 'Invalid or expired token'
    };
  }
  
  const user = users.find(u => u.id === decoded.userId);
  
  if (!user) {
    return {
      success: false,
      error: 'User not found'
    };
  }
  
  // 解析请求体
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const bio = formData.get('bio') as string;
  
  // 更新用户信息
  if (username) {
    // 检查用户名是否已被其他用户使用
    if (users.find(u => u.username === username && u.id !== user.id)) {
      return {
        success: false,
        error: 'Username already exists'
      };
    }
    user.username = username;
  }
  
  return {
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }
  };
}

/**
 * 文件上传 Action（示例）
 */
export async function uploadFile(formData: FormData) {
  const authHeader = formData.get('authorization') as string;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid authorization header'
    };
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return {
      success: false,
      error: 'Invalid or expired token'
    };
  }
  
  const file = formData.get('file') as File;
  
  if (!file) {
    return {
      success: false,
      error: 'No file provided'
    };
  }
  
  // 检查文件大小（限制为 5MB）
  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      error: 'File too large. Maximum size is 5MB'
    };
  }
  
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: 'File type not allowed. Allowed types: JPEG, PNG, GIF, PDF'
    };
  }
  
  // 实际项目中应该将文件保存到云存储或本地文件系统
  const fileId = Math.random().toString(36).substr(2, 9);
  
  return {
    success: true,
    message: 'File uploaded successfully',
    file: {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date()
    }
  };
}

/**
 * 获取所有用户列表 Action（管理员功能）
 */
export async function getAllUsers(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid authorization header'
    };
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return {
      success: false,
      error: 'Invalid or expired token'
    };
  }
  
  // 实际项目中应该检查用户权限
  
  return {
    success: true,
    users: users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }))
  };
}

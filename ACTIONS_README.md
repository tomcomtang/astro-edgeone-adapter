# Astro Actions 接口注册示例

这个项目展示了如何在 Astro EdgeOne 适配器中使用 Actions 接口注册功能。

## 🚀 功能特性

- **用户注册** - 完整的用户注册流程
- **用户登录** - JWT token 认证
- **用户信息管理** - 获取和更新用户信息
- **文件上传** - 支持多种文件类型上传
- **API 路由** - 完整的 RESTful API 设计
- **错误处理** - 完善的错误处理和验证

## 📁 文件结构

```
src/
├── actions/
│   └── user.ts          # 用户相关的 Actions
├── pages/
│   ├── actions.astro    # Actions 示例说明页面
│   ├── register.astro   # 用户注册页面
│   └── api/
│       └── [...slug].astro  # API 路由处理
```

## 🛠️ 使用方法

### 1. 查看示例页面

访问以下页面查看 Actions 的使用示例：

- **Actions 示例页面**: `/actions` - 详细的 API 文档和示例
- **用户注册页面**: `/register` - 实际的用户注册表单

### 2. API 端点

项目提供以下 API 端点：

| 方法 | 端点                | 描述                   |
| ---- | ------------------- | ---------------------- |
| POST | `/api/register`     | 用户注册               |
| POST | `/api/login`        | 用户登录               |
| GET  | `/api/user/profile` | 获取用户信息           |
| PUT  | `/api/user/profile` | 更新用户信息           |
| POST | `/api/upload`       | 文件上传               |
| GET  | `/api/users`        | 获取所有用户（管理员） |

### 3. 表单使用示例

```astro
---
import { registerUser } from '../actions/user.ts';
---

<form method="POST" action={registerUser}>
  <input name="username" placeholder="用户名" required />
  <input name="email" type="email" placeholder="邮箱" required />
  <input name="password" type="password" placeholder="密码" required />
  <button type="submit">注册</button>
</form>
```

### 4. Action 实现示例

```typescript
export async function registerUser(formData: FormData) {
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 验证输入
  if (!username || !email || !password) {
    return {
      success: false,
      error: "Missing required fields",
    };
  }

  // 处理注册逻辑
  // ...

  return {
    success: true,
    message: "User registered successfully",
  };
}
```

## 🔧 技术实现

### Actions 特性

- **类型安全** - 使用 TypeScript 确保类型安全
- **表单处理** - 自动处理表单数据
- **错误处理** - 统一的错误处理机制
- **响应格式** - 标准化的 API 响应格式

### 安全特性

- **输入验证** - 所有输入都经过验证
- **JWT 认证** - 使用 JWT token 进行身份验证
- **文件类型检查** - 限制上传文件的类型
- **文件大小限制** - 防止大文件上传

### EdgeOne 适配器集成

- **路由配置** - 自动配置 API 路由
- **依赖管理** - 智能的依赖包管理
- **性能优化** - 优化的构建和部署流程

## 🧪 测试

### 使用 curl 测试

```bash
# 用户注册
curl -X POST https://your-domain.edgeone.run/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass"}'

# 用户登录
curl -X POST https://your-domain.edgeone.run/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'
```

### 使用 JavaScript fetch

```javascript
// 注册用户
const response = await fetch("/api/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "testuser",
    email: "test@example.com",
    password: "testpass",
  }),
});

const result = await response.json();
console.log(result);
```

## 📚 学习资源

- [Astro Actions 官方文档](https://docs.astro.build/en/guides/actions/)
- [Astro EdgeOne 适配器文档](./README.md)
- [RESTful API 设计指南](https://restfulapi.net/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个示例项目！

## 📄 许可证

MIT License

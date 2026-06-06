# 绿产智链（Green-Link）API 接口规范文档

> **项目**：山东省绿色低碳产业生态智慧链接平台  
> **规范版本**：V1.0（一期）  
> **规范基准**：OpenAPI 3.0.3  
> **文档状态**：正式版  
> **编制日期**：2026-06-03  

---

## 目录

1. [全局规范](#1-全局规范)
   - 1.1 [服务与路由](#11-服务与路由)
   - 1.2 [鉴权说明](#12-鉴权说明)
   - 1.3 [统一响应结构](#13-统一响应结构)
   - 1.4 [分页规范](#14-分页规范)
   - 1.5 [错误码规范](#15-错误码规范)
   - 1.6 [公共 Schema 定义](#16-公共-schema-定义)
2. [认证模块（gl-auth）](#2-认证模块gl-auth)
3. [会员模块（gl-member）](#3-会员模块gl-member)
4. [权限模块（gl-member / RBAC）](#4-权限模块gl-member--rbac)
5. [供需资源模块（gl-supply）](#5-供需资源模块gl-supply)
6. [匹配对接模块（gl-match）](#6-匹配对接模块gl-match)
7. [门户内容模块（gl-portal）](#7-门户内容模块gl-portal)
8. [标签模块（gl-common）](#8-标签模块gl-common)
9. [消息通知模块（gl-message）](#9-消息通知模块gl-message)
10. [文件上传模块（gl-file）](#10-文件上传模块gl-file)
11. [变更记录](#11-变更记录)

---

## 1. 全局规范

### 1.1 服务与路由

#### 基础 URL

| 环境 | Base URL |
|---|---|
| 开发 | `http://gateway.dev.greenlink.local` |
| 测试 | `https://gateway.test.greenlink.com` |
| 生产 | `https://api.greenlink.com` |

所有 API 统一通过 **Spring Cloud Gateway** 路由，对外只暴露一个入口域名，服务名对前端透明。

#### 路由规则

| 路径前缀 | 路由至服务 | 说明 |
|---|---|---|
| `/api/v1/auth/**` | `gl-auth` | 登录、注册、Token 刷新 |
| `/api/v1/members/**` | `gl-member` | 会员单位、账号管理 |
| `/api/v1/rbac/**` | `gl-member` | 角色权限管理 |
| `/api/v1/supply/**` | `gl-supply` | 资源/需求发布 |
| `/api/v1/match/**` | `gl-match` | 匹配对接 |
| `/api/v1/portal/**` | `gl-portal` | 门户文章/活动 |
| `/api/v1/tags/**` | `gl-tag` | 标签体系 |
| `/api/v1/tag-categories/**` | `gl-tag` | 标签分类管理 |
| `/api/v1/tag-relations/**` | `gl-tag` | 业务标签关联 |
| `/api/v1/messages/**` | `gl-message` | 消息通知 |
| `/api/v1/files/**` | `gl-file` | 文件上传 |
| `/api/v1/admin/**` | `gl-admin` (BFF) | 管理端聚合接口 |

#### URL 命名规范

```
GET    /api/v1/{resource}              # 列表分页查询
GET    /api/v1/{resource}/{id}         # 单条详情
POST   /api/v1/{resource}              # 新建
PUT    /api/v1/{resource}/{id}         # 全量更新
PATCH  /api/v1/{resource}/{id}         # 部分字段更新
DELETE /api/v1/{resource}/{id}         # 删除（软删除）
POST   /api/v1/{resource}/{id}/{action} # 业务动作（审核/申请/取消等）
```

- 资源名使用**复数名词**，全部小写，单词间用 `-` 连接（如 `supply-resources`、`match-records`）
- 版本号 `v1` 必须保留；二期新增或不兼容变更使用 `v2`
- 禁止在 URL 中使用动词（如 `/getUser`、`/doApprove`）

---

### 1.2 鉴权说明

#### 认证方式

平台采用 **OAuth2 + JWT** 体系，Access Token 有效期 **2 小时**，Refresh Token 有效期 **7 天**。

```
Authorization: Bearer <access_token>
```

#### Token 获取流程

```
客户端                          gl-gateway                    gl-auth
  |                                  |                            |
  |-- POST /api/v1/auth/login ------>|                            |
  |                                  |-- 路由转发 --------------->|
  |                                  |<-- {accessToken, refreshToken}
  |<-- 200 {accessToken, ...} -------|
  |                                  |
  |-- GET /api/v1/supply/resources ->|                            |
  |   Authorization: Bearer <token>  |                            |
  |                                  |-- 验签（公钥） -----------|
  |                                  |-- 注入 X-Account-Id 头 ---|
  |                                  |-- 路由至 gl-supply ------->
```

#### 接口访问权限级别

| 级别 | 标记 | 说明 |
|---|---|---|
| 公开 | `🔓 Public` | 无需 Token，门户前台浏览类接口 |
| 登录 | `🔑 Login` | 需要有效 Access Token |
| 会员 | `👤 Member` | 需要 Token + 角色含 MEMBER/VIP_MEMBER |
| 管理 | `🛡️ Admin` | 需要 Token + 角色含 AUDITOR/CONTENT_ADMIN/SUPER_ADMIN |
| 超管 | `⚡ Super` | 仅 SUPER_ADMIN 可访问 |

#### 微信端鉴权补充

微信小程序/H5 端通过微信 `code` 换取平台 JWT，流程：

```
POST /api/v1/auth/wechat-login
Body: { "code": "<微信授权code>", "appType": "MINIAPP" }
```

---

### 1.3 统一响应结构

所有接口 HTTP 状态码均返回 **200**，业务结果通过响应体 `code` 字段区分。

#### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": { },
  "timestamp": 1717380000000
}
```

#### 失败响应

```json
{
  "code": 1001,
  "msg": "参数校验失败：手机号格式不正确",
  "data": null,
  "timestamp": 1717380000000
}
```

#### OpenAPI Schema 定义

```yaml
# 统一响应包装
Result:
  type: object
  required: [code, msg, timestamp]
  properties:
    code:
      type: integer
      description: "业务码，0 表示成功，非 0 表示错误"
      example: 0
    msg:
      type: string
      description: "提示信息"
      example: "success"
    data:
      description: "响应数据，失败时为 null"
    timestamp:
      type: integer
      format: int64
      description: "服务端响应时间戳（毫秒）"
      example: 1717380000000
```

---

### 1.4 分页规范

#### 请求参数（Query String）

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `page` | integer | 1 | 页码，从 1 开始 |
| `size` | integer | 20 | 每页条数，最大 100 |
| `sort` | string | `created_at,desc` | 排序字段，格式：`字段名,asc\|desc`，多字段用 `;` 分隔 |

示例：`GET /api/v1/supply/resources?page=2&size=10&sort=created_at,desc`

#### 分页响应 Schema

```yaml
PageResult:
  type: object
  properties:
    records:
      type: array
      description: "当前页数据列表"
    total:
      type: integer
      format: int64
      description: "总记录数"
      example: 256
    page:
      type: integer
      description: "当前页码"
      example: 2
    size:
      type: integer
      description: "每页条数"
      example: 10
    pages:
      type: integer
      description: "总页数"
      example: 26
```

---

### 1.5 错误码规范

#### 错误码分段

| 范围 | 所属模块 | 说明 |
|---|---|---|
| `0` | — | 成功 |
| `1000–1099` | 通用 | 参数、格式、系统类错误 |
| `1100–1199` | 通用 | 权限与鉴权错误 |
| `1200–1299` | 通用 | 限流与熔断 |
| `2000–2099` | 认证 | 登录与 Token 错误 |
| `2100–2199` | 会员 | 会员账号错误 |
| `3000–3099` | 供需 | 资源/需求错误 |
| `3100–3199` | 匹配 | 对接记录错误 |
| `4000–4099` | 门户 | 文章/活动错误 |
| `5000–5099` | 消息 | 通知发送错误 |
| `6000–6099` | 文件 | 上传/下载错误 |

#### 完整错误码表

| 错误码 | HTTP 状态 | 说明 | 处理建议 |
|---|---|---|---|
| `0` | 200 | 成功 | — |
| **通用类** | | | |
| `1000` | 200 | 参数校验失败 | 检查请求参数格式 |
| `1001` | 200 | 必填参数缺失 | 补充必要参数 |
| `1002` | 200 | 参数超出允许范围 | 调整参数值 |
| `1003` | 200 | 请求体 JSON 格式错误 | 检查 Content-Type 与 JSON 格式 |
| `1010` | 200 | 系统内部错误 | 稍后重试，持续失败联系运维 |
| `1011` | 200 | 服务暂时不可用 | 稍后重试 |
| `1020` | 200 | 数据不存在 | 检查资源 ID 是否正确 |
| `1021` | 200 | 数据已被删除 | — |
| `1030` | 200 | 操作过于频繁 | 降低调用频率 |
| **权限类** | | | |
| `1100` | 200 | 未登录或 Token 已过期 | 重新登录获取 Token |
| `1101` | 200 | Token 无效或签名错误 | 重新登录 |
| `1102` | 200 | Token 已被吊销 | 重新登录 |
| `1103` | 200 | 权限不足 | 确认当前账号角色 |
| `1104` | 200 | 禁止越权访问他人数据 | 检查请求资源归属 |
| **认证类** | | | |
| `2000` | 200 | 用户名或密码错误 | — |
| `2001` | 200 | 账号已被锁定，请 N 分钟后重试 | msg 中含剩余锁定时间 |
| `2002` | 200 | 账号已被禁用 | 联系协会管理员 |
| `2003` | 200 | 账号待审核，暂无法登录 | 等待审核结果 |
| `2004` | 200 | 验证码错误或已过期 | 重新获取验证码 |
| `2005` | 200 | Refresh Token 已过期，请重新登录 | 引导用户重新登录 |
| `2010` | 200 | 用户名已被占用 | 更换用户名 |
| `2011` | 200 | 手机号已注册 | — |
| `2012` | 200 | 微信 OpenID 绑定失败 | 检查微信授权 |
| **会员类** | | | |
| `2100` | 200 | 会员单位不存在 | — |
| `2101` | 200 | 会员信息审核中，请等待 | — |
| `2102` | 200 | 无权操作该子账号 | 仅集团主账号可管理子账号 |
| `2103` | 200 | 子账号数量已达上限 | — |
| **供需类** | | | |
| `3000` | 200 | 资源不存在或已下架 | — |
| `3001` | 200 | 需求不存在或已关闭 | — |
| `3002` | 200 | 资源审核中，无法操作 | 等待审核通过 |
| `3003` | 200 | 无权修改他人发布的资源 | — |
| `3004` | 200 | 附件数量超出限制（最多 10 个） | 减少附件数量 |
| `3005` | 200 | 资源已过有效期 | — |
| **匹配类** | | | |
| `3100` | 200 | 对接记录不存在 | — |
| `3101` | 200 | 不能与自己发起的资源/需求对接 | — |
| `3102` | 200 | 该对接记录已存在 | — |
| `3103` | 200 | 对接状态不允许此操作 | 检查当前对接状态 |
| `3104` | 200 | 无权操作该对接记录 | — |
| **门户类** | | | |
| `4000` | 200 | 文章不存在 | — |
| `4001` | 200 | 活动不存在 | — |
| `4002` | 200 | 活动报名已截止 | — |
| `4003` | 200 | 活动名额已满 | — |
| `4004` | 200 | 已报名，请勿重复提交 | — |
| `4005` | 200 | 活动未开放报名 | — |
| **文件类** | | | |
| `6000` | 200 | 文件类型不允许上传 | 检查允许的文件类型 |
| `6001` | 200 | 文件大小超出限制（最大 20MB） | 压缩后重试 |
| `6002` | 200 | 文件上传失败，请重试 | — |
| `6003` | 200 | 文件不存在或已失效 | — |

---

### 1.6 公共 Schema 定义

以下 Schema 被多个接口复用，在此统一定义。

```yaml
# ─────────────────────────────────────────
# 基础实体公共字段（所有详情响应均包含）
# ─────────────────────────────────────────
BaseEntity:
  type: object
  properties:
    id:
      type: integer
      format: int64
      description: "主键 ID"
      example: 100001
    createdAt:
      type: string
      format: date-time
      description: "创建时间"
      example: "2026-03-01T09:30:00+08:00"
    updatedAt:
      type: string
      format: date-time
      description: "最后更新时间"
      example: "2026-03-15T14:22:00+08:00"

# ─────────────────────────────────────────
# 标签简要信息
# ─────────────────────────────────────────
TagBrief:
  type: object
  properties:
    id:
      type: integer
      format: int64
      example: 201
    name:
      type: string
      example: "节能环保"
    categoryCode:
      type: string
      example: "INDUSTRY"

# ─────────────────────────────────────────
# 会员单位简要信息（嵌入其他响应）
# ─────────────────────────────────────────
MemberBrief:
  type: object
  properties:
    id:
      type: integer
      format: int64
      example: 1001
    name:
      type: string
      example: "山东绿能科技有限公司"
    shortName:
      type: string
      example: "绿能科技"
    memberLevel:
      type: integer
      description: "1普通 2VIP 3理事"
      example: 2
    logoUrl:
      type: string
      nullable: true
      example: "https://cdn.greenlink.com/logos/1001.png"
    province:
      type: string
      example: "山东省"
    city:
      type: string
      example: "济南市"
    isCertified:
      type: boolean
      description: "是否绿色认证（二期功能，一期恒为 false）"
      example: false
```

---

## 2. 认证模块（gl-auth）

### 2.1 账号密码登录

`POST /api/v1/auth/login` 🔓 Public

用于会员和管理员账号密码登录，连续失败 ≥5 次触发图形验证码，≥10 次锁定账号 30 分钟。

#### 请求体

```yaml
LoginRequest:
  type: object
  required: [username, password]
  properties:
    username:
      type: string
      description: "登录名（用户名或手机号）"
      example: "zhangsan_tech"
    password:
      type: string
      format: password
      description: "明文密码（HTTPS 传输，服务端 BCrypt 验证）"
      example: "P@ssw0rd123"
    captchaToken:
      type: string
      nullable: true
      description: "图形验证码 token（登录失败 ≥5 次后必填）"
      example: "cap_abc123xyz"
    captchaCode:
      type: string
      nullable: true
      description: "用户输入的验证码字符"
      example: "A8K2"
```

#### 成功响应 `200`

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "rt_8f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c",
    "expiresIn": 7200,
    "tokenType": "Bearer",
    "accountInfo": {
      "accountId": 10001,
      "memberId": 1001,
      "username": "zhangsan_tech",
      "realName": "张三",
      "avatarUrl": "https://cdn.greenlink.com/avatars/10001.jpg",
      "roles": ["MEMBER"],
      "memberName": "山东绿能科技有限公司",
      "memberLevel": 1
    }
  },
  "timestamp": 1717380000000
}
```

#### 错误示例

```json
{ "code": 2000, "msg": "用户名或密码错误，还可尝试 3 次", "data": null, "timestamp": 1717380000000 }
{ "code": 2001, "msg": "账号已锁定，请 28 分钟后重试", "data": null, "timestamp": 1717380000000 }
{ "code": 2004, "msg": "验证码错误或已过期", "data": null, "timestamp": 1717380000000 }
```

---

### 2.2 微信登录 / 绑定

`POST /api/v1/auth/wechat-login` 🔓 Public

微信端（小程序/服务号 H5）使用微信授权 code 换取平台 JWT。若当前 OpenID 未绑定平台账号，返回 `bound: false` 引导用户注册或绑定。

#### 请求体

```yaml
WechatLoginRequest:
  type: object
  required: [code, appType]
  properties:
    code:
      type: string
      description: "微信授权 code（wx.login 获取，有效期5分钟）"
      example: "0811abc123def456"
    appType:
      type: string
      enum: [MINIAPP, MP_H5, ENTERPRISE_WX]
      description: "微信入口类型：MINIAPP小程序 MP_H5服务号H5 ENTERPRISE_WX企业微信"
      example: "MINIAPP"
```

#### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "bound": true,
    "accessToken": "eyJhbGci...",
    "refreshToken": "rt_...",
    "expiresIn": 7200,
    "tokenType": "Bearer",
    "accountInfo": { "accountId": 10001, "username": "zhangsan_tech" }
  },
  "timestamp": 1717380000000
}
```

未绑定时：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "bound": false,
    "wxBindToken": "wxbind_temp_xyz789",
    "nickName": "微信用户昵称",
    "avatarUrl": "https://thirdwx.qlogo.cn/..."
  },
  "timestamp": 1717380000000
}
```

---

### 2.3 刷新 Token

`POST /api/v1/auth/refresh-token` 🔓 Public

Access Token 过期后使用 Refresh Token 无感刷新，Refresh Token 自动续期（滑动有效期）。

#### 请求体

```json
{ "refreshToken": "rt_8f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c" }
```

#### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "rt_new_token_here",
    "expiresIn": 7200
  },
  "timestamp": 1717380000000
}
```

---

### 2.4 登出

`POST /api/v1/auth/logout` 🔑 Login

服务端将 Access Token 加入 Redis 黑名单（TTL = Token 剩余有效期），Refresh Token 立即吊销。

#### 响应

```json
{ "code": 0, "msg": "success", "data": null, "timestamp": 1717380000000 }
```

---

### 2.5 获取图形验证码

`GET /api/v1/auth/captcha` 🔓 Public

连续登录失败 ≥5 次后前端调用此接口获取验证码。

#### 响应

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "captchaToken": "cap_abc123xyz",
    "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "expireIn": 300
  },
  "timestamp": 1717380000000
}
```

---

### 2.6 获取短信验证码

`POST /api/v1/auth/sms-code` 🔓 Public

用于手机号登录或找回密码场景，1 分钟内同一手机号限 1 次，1 小时内同一 IP 限 10 次。

#### 请求体

```json
{ "phone": "13812345678", "scene": "LOGIN" }
```

`scene` 枚举：`LOGIN`（手机号登录）| `REGISTER`（注册）| `RESET_PWD`（重置密码）

#### 响应

```json
{ "code": 0, "msg": "验证码已发送，有效期5分钟", "data": { "expireIn": 300 }, "timestamp": 1717380000000 }
```

---

### 2.7 修改密码

`POST /api/v1/auth/change-password` 🔑 Login

#### 请求体

```yaml
ChangePasswordRequest:
  type: object
  required: [oldPassword, newPassword]
  properties:
    oldPassword:
      type: string
      format: password
      description: "当前密码"
    newPassword:
      type: string
      format: password
      description: "新密码（8–20位，须含字母+数字）"
      minLength: 8
      maxLength: 20
```

---

### 2.8 OpenAPI 规范片段

```yaml
paths:
  /api/v1/auth/login:
    post:
      tags: [认证]
      summary: 账号密码登录
      operationId: login
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: 登录结果
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Result'
                  - properties:
                      data:
                        $ref: '#/components/schemas/LoginResponse'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: "Authorization: Bearer <access_token>"

security:
  - BearerAuth: []
```

---

## 3. 会员模块（gl-member）

### 3.1 Schema 定义

```yaml
# ─────────────────────────────────────────
# 会员单位完整信息
# ─────────────────────────────────────────
MemberUnit:
  allOf:
    - $ref: '#/components/schemas/BaseEntity'
    - type: object
      properties:
        name:
          type: string
          description: "单位全称"
          example: "山东绿能科技有限公司"
        shortName:
          type: string
          nullable: true
          example: "绿能科技"
        industry:
          type: string
          description: "所属行业（标签名）"
          example: "新能源"
        province:
          type: string
          example: "山东省"
        city:
          type: string
          example: "济南市"
        memberLevel:
          type: integer
          description: "1普通 2VIP 3理事"
          example: 1
        memberLevelName:
          type: string
          example: "普通会员"
        creditScore:
          type: number
          format: double
          description: "信用评分 0–100（一期恒为100.00）"
          example: 100.00
        logoUrl:
          type: string
          nullable: true
        introduction:
          type: string
          nullable: true
        contactName:
          type: string
          nullable: true
        contactPhone:
          type: string
          description: "联系电话（非会员查看时脱敏为 138****8888）"
          nullable: true
          example: "138****8888"
        contactEmail:
          type: string
          nullable: true
          example: "zhang***@greenlink.com"
        isCertified:
          type: boolean
          example: false
        status:
          type: integer
          description: "0禁用 1正常 2审核中"
          example: 1
        statusName:
          type: string
          example: "正常"
        joinDate:
          type: string
          format: date
          nullable: true
          example: "2026-01-15"
        tags:
          type: array
          items:
            $ref: '#/components/schemas/TagBrief'

# ─────────────────────────────────────────
# 会员单位注册/创建请求
# ─────────────────────────────────────────
CreateMemberRequest:
  type: object
  required: [name, industry, username, password, phone]
  properties:
    name:
      type: string
      maxLength: 200
      description: "单位全称"
      example: "山东绿能科技有限公司"
    shortName:
      type: string
      maxLength: 50
      nullable: true
    industry:
      type: string
      description: "所属行业（标签名或标签ID）"
      example: "新能源"
    province:
      type: string
      nullable: true
    city:
      type: string
      nullable: true
    introduction:
      type: string
      maxLength: 2000
      nullable: true
    contactName:
      type: string
      maxLength: 50
      nullable: true
    contactPhone:
      type: string
      pattern: '^1[3-9]\d{9}$'
      nullable: true
    contactEmail:
      type: string
      format: email
      nullable: true
    logoFileId:
      type: integer
      format: int64
      description: "Logo 文件 ID（先上传文件，再传 file_record.id）"
      nullable: true
    tagIds:
      type: array
      items:
        type: integer
        format: int64
      description: "关联标签 ID 列表"
    # 主账号信息
    username:
      type: string
      minLength: 4
      maxLength: 50
      description: "主账号登录名"
    password:
      type: string
      format: password
      minLength: 8
      maxLength: 20
      description: "主账号密码（8–20位，含字母+数字）"
    phone:
      type: string
      pattern: '^1[3-9]\d{9}$'
      description: "主账号手机号"
    smsCode:
      type: string
      description: "手机验证码（注册场景必填）"
```

### 3.2 注册会员

`POST /api/v1/members/register` 🔓 Public

新会员注册，同时创建会员单位与主账号，初始状态为"审核中"（`status=2`）。

#### 请求体

```json
{
  "name": "山东绿能科技有限公司",
  "shortName": "绿能科技",
  "industry": "新能源",
  "province": "山东省",
  "city": "济南市",
  "username": "zhangsan_tech",
  "password": "P@ssw0rd123",
  "phone": "13812345678",
  "smsCode": "842931",
  "tagIds": [101, 105, 207]
}
```

#### 成功响应 `200`

```json
{
  "code": 0,
  "msg": "注册成功，请等待协会审核（预计1-3个工作日）",
  "data": {
    "memberId": 1023,
    "memberStatus": 2,
    "accountId": 20045
  },
  "timestamp": 1717380000000
}
```

---

### 3.3 获取会员单位列表

`GET /api/v1/members` 🔓 Public（管理端查看敏感信息需 🛡️ Admin）

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `page` | integer | 否 | 默认 1 |
| `size` | integer | 否 | 默认 20 |
| `keyword` | string | 否 | 单位名称模糊搜索 |
| `industry` | string | 否 | 行业筛选（标签名） |
| `province` | string | 否 | 省份筛选 |
| `memberLevel` | integer | 否 | 会员等级筛选 |
| `status` | integer | 否 | 状态筛选（管理端用） |

#### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "records": [
      {
        "id": 1001,
        "name": "山东绿能科技有限公司",
        "shortName": "绿能科技",
        "industry": "新能源",
        "memberLevel": 2,
        "memberLevelName": "VIP会员",
        "province": "山东省",
        "city": "济南市",
        "logoUrl": "https://cdn.greenlink.com/logos/1001.png",
        "isCertified": false,
        "tags": [{ "id": 101, "name": "节能环保", "categoryCode": "INDUSTRY" }],
        "createdAt": "2026-01-15T10:00:00+08:00"
      }
    ],
    "total": 156,
    "page": 1,
    "size": 20,
    "pages": 8
  },
  "timestamp": 1717380000000
}
```

---

### 3.4 获取会员单位详情

`GET /api/v1/members/{memberId}` 🔓 Public

联系方式仅登录会员可查看原始数据，未登录时自动脱敏。

---

### 3.5 更新会员单位信息

`PUT /api/v1/members/{memberId}` 🔑 Login（仅本单位主账号或管理员）

#### 请求体

```yaml
UpdateMemberRequest:
  type: object
  properties:
    shortName:
      type: string
      maxLength: 50
      nullable: true
    industry:
      type: string
    province:
      type: string
    city:
      type: string
    introduction:
      type: string
      maxLength: 2000
    contactName:
      type: string
    contactPhone:
      type: string
    contactEmail:
      type: string
      format: email
    logoFileId:
      type: integer
      format: int64
      nullable: true
    tagIds:
      type: array
      items:
        type: integer
        format: int64
```

---

### 3.6 审核会员（管理端）

`POST /api/v1/members/{memberId}/audit` 🛡️ Admin

#### 请求体

```json
{
  "action": "APPROVE",
  "remark": "资质齐全，审核通过"
}
```

`action` 枚举：`APPROVE`（通过）| `REJECT`（拒绝）

---

### 3.7 子账号管理

#### 创建子账号

`POST /api/v1/members/{memberId}/sub-accounts` 🔑 Login（主账号）

```json
{
  "username": "lisi_operations",
  "password": "P@ssw0rd123",
  "phone": "13987654321",
  "realName": "李四",
  "roleIds": [3]
}
```

#### 获取子账号列表

`GET /api/v1/members/{memberId}/sub-accounts` 🔑 Login

#### 禁用/启用子账号

`PATCH /api/v1/members/{memberId}/sub-accounts/{accountId}` 🔑 Login

```json
{ "status": 0 }
```

---

### 3.8 当前账号个人信息

`GET /api/v1/members/me` 🔑 Login

返回当前登录账号的完整信息，含所属单位、角色、权限列表。

#### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "accountId": 10001,
    "username": "zhangsan_tech",
    "realName": "张三",
    "phone": "138****8888",
    "email": "zhang***@greenlink.com",
    "avatarUrl": "https://cdn.greenlink.com/avatars/10001.jpg",
    "roles": ["MEMBER"],
    "permissions": ["supply:resource:publish", "supply:demand:publish", "match:apply"],
    "member": {
      "id": 1001,
      "name": "山东绿能科技有限公司",
      "memberLevel": 1,
      "status": 1
    },
    "isMainAccount": true,
    "lastLoginAt": "2026-06-03T09:00:00+08:00"
  },
  "timestamp": 1717380000000
}
```

---

## 4. 权限模块（gl-member / RBAC）

### 4.1 获取角色列表

`GET /api/v1/rbac/roles` 🛡️ Admin

#### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "code": "SUPER_ADMIN",
      "name": "超级管理员",
      "description": "协会 IT 管理员，全权限",
      "isSystem": true
    },
    {
      "id": 2,
      "code": "AUDITOR",
      "name": "审核管理员",
      "description": "会员信息与供需内容审核",
      "isSystem": true
    }
  ],
  "timestamp": 1717380000000
}
```

---

### 4.2 获取权限树

`GET /api/v1/rbac/permissions` 🛡️ Admin

返回权限树形结构（菜单 + 操作两级）。

#### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "code": "supply",
      "name": "供需管理",
      "type": 1,
      "children": [
        { "id": 11, "code": "supply:resource:publish", "name": "发布资源", "type": 2 },
        { "id": 12, "code": "supply:resource:audit",   "name": "审核资源", "type": 2 }
      ]
    }
  ],
  "timestamp": 1717380000000
}
```

---

### 4.3 为角色分配权限

`PUT /api/v1/rbac/roles/{roleId}/permissions` ⚡ Super

#### 请求体

```json
{ "permissionIds": [11, 12, 21, 31] }
```

---

### 4.4 为账号分配角色

`PUT /api/v1/rbac/accounts/{accountId}/roles` 🛡️ Admin

```json
{ "roleIds": [2, 3] }
```

---

## 5. 供需资源模块（gl-supply）

### 5.1 Schema 定义

```yaml
# ─────────────────────────────────────────
# 资源完整信息
# ─────────────────────────────────────────
SupplyResource:
  allOf:
    - $ref: '#/components/schemas/BaseEntity'
    - type: object
      properties:
        type:
          type: string
          enum: [PRODUCT, TECHNOLOGY, TALENT]
          description: "资源类型"
          example: "TECHNOLOGY"
        typeName:
          type: string
          example: "技术"
        title:
          type: string
          example: "高效光伏组件封装工艺技术转让"
        summary:
          type: string
          example: "本技术可提升光伏转换效率约2%..."
        content:
          type: string
          description: "富文本内容（HTML，DOMPurify 过滤后渲染）"
        province:
          type: string
          example: "山东省"
        city:
          type: string
          example: "济南市"
        cooperationMode:
          type: string
          example: "技术授权"
        validUntil:
          type: string
          format: date
          nullable: true
          example: "2026-12-31"
        viewCount:
          type: integer
          example: 238
        contactVisible:
          type: boolean
          example: true
        auditStatus:
          type: integer
          description: "0待审核 1通过 2拒绝 3已下架"
          example: 1
        auditStatusName:
          type: string
          example: "已发布"
        auditRemark:
          type: string
          nullable: true
        member:
          $ref: '#/components/schemas/MemberBrief'
        tags:
          type: array
          items:
            $ref: '#/components/schemas/TagBrief'
        attachments:
          type: array
          items:
            $ref: '#/components/schemas/AttachmentBrief'
        isFavorited:
          type: boolean
          description: "当前登录用户是否已收藏（未登录时为 false）"
          example: false

# ─────────────────────────────────────────
# 附件简要信息
# ─────────────────────────────────────────
AttachmentBrief:
  type: object
  properties:
    id:
      type: integer
      format: int64
    fileName:
      type: string
      example: "技术方案说明书.pdf"
    fileUrl:
      type: string
      example: "https://cdn.greenlink.com/files/uuid-xxx.pdf"
    fileSize:
      type: integer
      format: int64
      example: 2048000
    fileType:
      type: string
      example: "application/pdf"
    sortOrder:
      type: integer
      example: 0

# ─────────────────────────────────────────
# 发布/更新资源请求
# ─────────────────────────────────────────
CreateResourceRequest:
  type: object
  required: [type, title]
  properties:
    type:
      type: string
      enum: [PRODUCT, TECHNOLOGY, TALENT]
    title:
      type: string
      maxLength: 300
      example: "高效光伏组件封装工艺技术转让"
    summary:
      type: string
      maxLength: 500
      nullable: true
    content:
      type: string
      description: "富文本 HTML（后端 XSS 过滤）"
      nullable: true
    province:
      type: string
      nullable: true
    city:
      type: string
      nullable: true
    cooperationMode:
      type: string
      maxLength: 200
      nullable: true
    validUntil:
      type: string
      format: date
      nullable: true
    contactVisible:
      type: boolean
      default: true
    tagIds:
      type: array
      items:
        type: integer
        format: int64
      maxItems: 10
    attachmentFileIds:
      type: array
      description: "附件文件ID列表（先调用上传接口）"
      items:
        type: integer
        format: int64
      maxItems: 10
```

---

### 5.2 资源列表（公开）

`GET /api/v1/supply/resources` 🔓 Public

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `page` | integer | 否 | 默认 1 |
| `size` | integer | 否 | 默认 20 |
| `keyword` | string | 否 | 标题/内容关键词（ES 全文检索） |
| `type` | string | 否 | 资源类型：PRODUCT/TECHNOLOGY/TALENT |
| `province` | string | 否 | 省份筛选 |
| `tagIds` | string | 否 | 标签 ID 列表，逗号分隔：`101,205` |
| `sort` | string | 否 | 排序：`created_at,desc`（默认）/ `view_count,desc` |

#### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "records": [
      {
        "id": 3001,
        "type": "TECHNOLOGY",
        "typeName": "技术",
        "title": "高效光伏组件封装工艺技术转让",
        "summary": "本技术可提升光伏转换效率约2%...",
        "province": "山东省",
        "city": "济南市",
        "cooperationMode": "技术授权",
        "validUntil": "2026-12-31",
        "viewCount": 238,
        "auditStatus": 1,
        "member": {
          "id": 1001,
          "name": "山东绿能科技有限公司",
          "shortName": "绿能科技",
          "memberLevel": 2,
          "logoUrl": "https://cdn.greenlink.com/logos/1001.png",
          "province": "山东省",
          "city": "济南市",
          "isCertified": false
        },
        "tags": [
          { "id": 101, "name": "光伏", "categoryCode": "TECH_FIELD" }
        ],
        "isFavorited": false,
        "createdAt": "2026-03-10T09:00:00+08:00"
      }
    ],
    "total": 342,
    "page": 1,
    "size": 20,
    "pages": 18
  },
  "timestamp": 1717380000000
}
```

---

### 5.3 资源详情

`GET /api/v1/supply/resources/{resourceId}` 🔓 Public

联系方式按 `contactVisible` + 登录状态决定是否脱敏，每次请求异步增加 `view_count`（写 Redis）。

---

### 5.4 发布资源

`POST /api/v1/supply/resources` 👤 Member

#### 请求体

```json
{
  "type": "TECHNOLOGY",
  "title": "高效光伏组件封装工艺技术转让",
  "summary": "本技术可提升光伏转换效率约2%，已获国家专利",
  "content": "<p>详细技术说明...</p>",
  "province": "山东省",
  "city": "济南市",
  "cooperationMode": "技术授权",
  "validUntil": "2026-12-31",
  "contactVisible": true,
  "tagIds": [101, 205],
  "attachmentFileIds": [80001, 80002]
}
```

#### 成功响应

```json
{
  "code": 0,
  "msg": "发布成功，请等待审核（预计1个工作日）",
  "data": { "resourceId": 3001, "auditStatus": 0 },
  "timestamp": 1717380000000
}
```

---

### 5.5 更新资源

`PUT /api/v1/supply/resources/{resourceId}` 👤 Member（本单位账号）

更新后若原状态为"已发布"，自动重置为"待审核"。

---

### 5.6 下架/删除资源

`DELETE /api/v1/supply/resources/{resourceId}` 👤 Member（本单位）或 🛡️ Admin

软删除（设 `is_deleted=1`），已有对接记录不受影响。

---

### 5.7 资源审核（管理端）

`POST /api/v1/supply/resources/{resourceId}/audit` 🛡️ Admin

```json
{
  "action": "APPROVE",
  "remark": "内容合规，审核通过"
}
```

---

### 5.8 我的资源列表

`GET /api/v1/supply/resources/mine` 🔑 Login

查询当前账号所属单位发布的所有资源，支持按状态筛选。

#### 额外查询参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `auditStatus` | integer | 状态筛选：0/1/2/3 |

---

### 5.9 需求相关接口

需求模块与资源模块结构一致，以下列出差异点：

| 路径 | 方法 | 权限 | 差异说明 |
|---|---|---|---|
| `/api/v1/supply/demands` | GET | 🔓 | 额外查询参数：`budgetMin`、`budgetMax`、`deadline` |
| `/api/v1/supply/demands` | POST | 👤 | 请求体额外字段：`budgetMin`、`budgetMax`（万元）、`deadline` |
| `/api/v1/supply/demands/{id}` | GET | 🔓 | 同资源详情 |
| `/api/v1/supply/demands/{id}` | PUT | 👤 | 同资源更新 |
| `/api/v1/supply/demands/{id}` | DELETE | 👤/🛡️ | 同资源删除 |
| `/api/v1/supply/demands/{id}/audit` | POST | 🛡️ | 同资源审核 |
| `/api/v1/supply/demands/mine` | GET | 🔑 | 我的需求列表 |

**需求创建请求额外字段：**

```yaml
budgetMin:
  type: number
  format: double
  description: "预算下限（万元），null 表示面议"
  nullable: true
  example: 50.00
budgetMax:
  type: number
  format: double
  description: "预算上限（万元）"
  nullable: true
  example: 200.00
deadline:
  type: string
  format: date
  description: "需求截止日期"
  nullable: true
  example: "2026-09-30"
```

---

## 6. 匹配对接模块（gl-match）

### 6.1 Schema 定义

```yaml
# ─────────────────────────────────────────
# 对接记录完整信息
# ─────────────────────────────────────────
MatchRecord:
  allOf:
    - $ref: '#/components/schemas/BaseEntity'
    - type: object
      properties:
        resourceId:
          type: integer
          format: int64
        demandId:
          type: integer
          format: int64
        resourceTitle:
          type: string
          example: "高效光伏组件封装工艺技术转让"
        demandTitle:
          type: string
          example: "光伏领域节能技术引进"
        resourceMember:
          $ref: '#/components/schemas/MemberBrief'
        demandMember:
          $ref: '#/components/schemas/MemberBrief'
        matchScore:
          type: number
          format: double
          description: "匹配度得分 0–100，主动申请时为 null"
          nullable: true
          example: 87.5
        matchType:
          type: integer
          description: "1系统推荐 2主动申请"
          example: 2
        matchTypeName:
          type: string
          example: "主动申请"
        status:
          type: integer
          description: "1待响应 2已接受 3洽谈中 5已完成 6已拒绝 7已撤销"
          example: 3
        statusName:
          type: string
          example: "洽谈中"
        applyMessage:
          type: string
          nullable: true
          example: "贵司技术与我方需求高度匹配，期望进一步交流"
        unreadCount:
          type: integer
          description: "当前用户未读消息数"
          example: 3
        lastMessageAt:
          type: string
          format: date-time
          nullable: true

# ─────────────────────────────────────────
# 对接消息
# ─────────────────────────────────────────
MatchMessage:
  type: object
  properties:
    id:
      type: integer
      format: int64
    matchId:
      type: integer
      format: int64
    senderId:
      type: integer
      format: int64
    senderName:
      type: string
      example: "张三"
    senderAvatar:
      type: string
      nullable: true
    content:
      type: string
    msgType:
      type: integer
      description: "1文本 2图片 3附件"
    attachUrl:
      type: string
      nullable: true
    isRead:
      type: boolean
    createdAt:
      type: string
      format: date-time
```

---

### 6.2 智能匹配推荐列表

`GET /api/v1/match/recommendations` 👤 Member

基于当前会员发布的资源/需求，调用匹配引擎（标签召回 + ES 全文 + 加权打分）返回推荐列表。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `sourceType` | string | 是 | 我是资源方还是需求方：`RESOURCE`/`DEMAND` |
| `sourceId` | integer | 是 | 我的资源 ID 或需求 ID |
| `page` | integer | 否 | 默认 1 |
| `size` | integer | 否 | 默认 10 |

#### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "records": [
      {
        "targetType": "DEMAND",
        "targetId": 4002,
        "targetTitle": "光伏领域节能技术引进",
        "targetMember": {
          "id": 1015,
          "name": "济南清洁能源集团",
          "memberLevel": 3,
          "province": "山东省"
        },
        "matchScore": 92.3,
        "matchReasons": ["行业标签高度匹配", "地域相近（同省）", "合作意向一致"],
        "isApplied": false
      }
    ],
    "total": 28,
    "page": 1,
    "size": 10,
    "pages": 3
  },
  "timestamp": 1717380000000
}
```

---

### 6.3 发起对接申请

`POST /api/v1/match/records` 👤 Member

#### 请求体

```yaml
CreateMatchRequest:
  type: object
  required: [resourceId, demandId]
  properties:
    resourceId:
      type: integer
      format: int64
      description: "目标资源 ID（申请方需求 → 对方资源，或反之）"
      example: 3001
    demandId:
      type: integer
      format: int64
      description: "目标需求 ID"
      example: 4002
    applyMessage:
      type: string
      maxLength: 1000
      description: "申请留言"
      example: "贵司技术与我方需求高度匹配，期望进一步交流"
```

```json
{
  "code": 0,
  "msg": "申请已发送，等待对方响应",
  "data": { "matchId": 5001, "status": 1 },
  "timestamp": 1717380000000
}
```

---

### 6.4 我的对接记录列表

`GET /api/v1/match/records` 🔑 Login

#### 查询参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `role` | string | 我的角色：`RESOURCE_SIDE`（资源方）/ `DEMAND_SIDE`（需求方）/ 不传返回全部 |
| `status` | integer | 状态筛选 |
| `page` / `size` | integer | 分页 |

---

### 6.5 对接记录详情

`GET /api/v1/match/records/{matchId}` 🔑 Login（仅对接双方可查看）

---

### 6.6 响应对接申请

`POST /api/v1/match/records/{matchId}/respond` 🔑 Login（被申请方）

```json
{
  "action": "ACCEPT",
  "message": "感谢您的申请，我们很感兴趣，期望进一步了解"
}
```

`action` 枚举：`ACCEPT`（接受，状态→2）| `REJECT`（拒绝，状态→6）

---

### 6.7 更新对接状态

`PATCH /api/v1/match/records/{matchId}/status` 🔑 Login（双方均可，权限校验）

```json
{
  "status": 5,
  "remark": "合作已完成，对方履约良好"
}
```

可流转的状态变更：

| 当前状态 | 可变更为 | 操作方 |
|---|---|---|
| 2 已接受 | 3 洽谈中 | 任意一方 |
| 3 洽谈中 | 5 已完成 | 任意一方 |
| 2/3 | 7 已撤销 | 申请发起方 |

---

### 6.8 发送对接消息

`POST /api/v1/match/records/{matchId}/messages` 🔑 Login（双方）

#### 请求体

```yaml
SendMessageRequest:
  type: object
  required: [msgType]
  properties:
    msgType:
      type: integer
      enum: [1, 2, 3]
      description: "1文本 2图片 3附件"
    content:
      type: string
      maxLength: 2000
      description: "文本消息内容（msgType=1 时必填）"
    attachFileId:
      type: integer
      format: int64
      description: "附件文件 ID（msgType=2/3 时必填）"
```

```json
{ "msgType": 1, "content": "请问贵司的技术可以适用于薄膜电池场景吗？" }
```

---

### 6.9 获取对接消息列表

`GET /api/v1/match/records/{matchId}/messages` 🔑 Login（双方）

查询后自动将未读消息标记为已读。

#### 查询参数：`page`、`size`（默认按 `created_at,asc` 排序，消息从早到晚）

---

### 6.10 收藏 / 取消收藏

`POST /api/v1/match/favorites` 🔑 Login

```json
{ "bizType": "RESOURCE", "bizId": 3001 }
```

`DELETE /api/v1/match/favorites` 🔑 Login（Body 同上）

---

### 6.11 我的收藏列表

`GET /api/v1/match/favorites` 🔑 Login

#### 查询参数：`bizType`（RESOURCE/DEMAND）、`page`、`size`

---

## 7. 门户内容模块（gl-portal）

### 7.1 Schema 定义

```yaml
PortalArticle:
  allOf:
    - $ref: '#/components/schemas/BaseEntity'
    - type: object
      properties:
        categoryId:
          type: integer
          format: int64
        categoryName:
          type: string
          example: "行业资讯"
        categoryCode:
          type: string
          example: "NEWS"
        title:
          type: string
          example: "山东省发布2026年绿色制造实施方案"
        summary:
          type: string
          example: "近日，山东省工业和信息化厅发布..."
        content:
          type: string
          description: "正文 HTML（仅详情接口返回）"
        coverUrl:
          type: string
          nullable: true
        author:
          type: string
          nullable: true
          example: "协会秘书处"
        sourceUrl:
          type: string
          nullable: true
        viewCount:
          type: integer
          example: 1280
        isTop:
          type: boolean
          example: false
        publishedAt:
          type: string
          format: date-time
          example: "2026-05-20T10:00:00+08:00"

PortalActivity:
  allOf:
    - $ref: '#/components/schemas/BaseEntity'
    - type: object
      properties:
        title:
          type: string
          example: "2026年度山东绿色低碳产业对接大会"
        summary:
          type: string
        content:
          type: string
          description: "详情接口返回"
        coverUrl:
          type: string
          nullable: true
        location:
          type: string
          example: "济南市国际会展中心 A馆"
        startTime:
          type: string
          format: date-time
        endTime:
          type: string
          format: date-time
        regDeadline:
          type: string
          format: date-time
          nullable: true
        maxCapacity:
          type: integer
          nullable: true
        regCount:
          type: integer
          example: 156
        status:
          type: integer
          description: "1筹备中 2报名中 3进行中 4已结束 5已取消"
        statusName:
          type: string
          example: "报名中"
        isSignedUp:
          type: boolean
          description: "当前用户是否已报名（未登录为 false）"
```

---

### 7.2 门户栏目列表

`GET /api/v1/portal/categories` 🔓 Public

```json
{
  "code": 0,
  "msg": "success",
  "data": [
    { "id": 1, "code": "NEWS",     "name": "行业资讯", "sortOrder": 1, "isVisible": true },
    { "id": 2, "code": "NOTICE",   "name": "协会通知", "sortOrder": 2, "isVisible": true },
    { "id": 3, "code": "POLICY",   "name": "政策法规", "sortOrder": 3, "isVisible": true },
    { "id": 4, "code": "ACTIVITY", "name": "活动专区", "sortOrder": 4, "isVisible": true }
  ],
  "timestamp": 1717380000000
}
```

---

### 7.3 文章列表

`GET /api/v1/portal/articles` 🔓 Public

#### 查询参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `categoryCode` | string | 栏目编码：NEWS/NOTICE/POLICY |
| `keyword` | string | 标题关键词搜索 |
| `isTop` | boolean | 是否只查置顶 |
| `page` / `size` | integer | 分页 |

#### 成功响应（列表，不含 content 字段）

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "records": [
      {
        "id": 6001,
        "categoryCode": "NEWS",
        "categoryName": "行业资讯",
        "title": "山东省发布2026年绿色制造实施方案",
        "summary": "近日，山东省工业和信息化厅发布...",
        "coverUrl": "https://cdn.greenlink.com/covers/6001.jpg",
        "author": "协会秘书处",
        "viewCount": 1280,
        "isTop": true,
        "publishedAt": "2026-05-20T10:00:00+08:00",
        "createdAt": "2026-05-20T09:30:00+08:00"
      }
    ],
    "total": 87,
    "page": 1,
    "size": 20,
    "pages": 5
  },
  "timestamp": 1717380000000
}
```

---

### 7.4 文章详情

`GET /api/v1/portal/articles/{articleId}` 🔓 Public

返回完整字段，含 `content` 富文本；异步增加 `view_count`。

---

### 7.5 发布文章（管理端）

`POST /api/v1/portal/articles` 🛡️ Admin

```yaml
CreateArticleRequest:
  type: object
  required: [categoryId, title]
  properties:
    categoryId:
      type: integer
      format: int64
    title:
      type: string
      maxLength: 300
    content:
      type: string
      description: "富文本 HTML（后端 XSS 过滤）"
    summary:
      type: string
      maxLength: 500
      description: "摘要（为空时自动截取 content 前200字）"
      nullable: true
    coverFileId:
      type: integer
      format: int64
      nullable: true
    author:
      type: string
      maxLength: 100
      nullable: true
    sourceUrl:
      type: string
      format: uri
      nullable: true
    isTop:
      type: boolean
      default: false
    isPublished:
      type: boolean
      default: false
      description: "true 立即发布，false 保存为草稿"
    publishedAt:
      type: string
      format: date-time
      description: "定时发布时间（isPublished=true 且此字段有值时定时发布）"
      nullable: true
```

---

### 7.6 更新/删除文章

`PUT /api/v1/portal/articles/{articleId}` 🛡️ Admin  
`DELETE /api/v1/portal/articles/{articleId}` 🛡️ Admin

---

### 7.7 首页轮播图列表

`GET /api/v1/portal/banners` 🔓 Public

仅返回当前时间在 `show_start` ~ `show_end` 区间内且 `is_active=1` 的记录，按 `sort_order` 升序。

```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "title": "2026年度对接大会即将开幕",
      "imageUrl": "https://cdn.greenlink.com/banners/1.jpg",
      "linkUrl": "/activity/2001",
      "linkType": 1,
      "sortOrder": 1
    }
  ],
  "timestamp": 1717380000000
}
```

---

### 7.8 活动列表

`GET /api/v1/portal/activities` 🔓 Public

#### 查询参数：`status`、`keyword`、`page`、`size`

---

### 7.9 活动详情

`GET /api/v1/portal/activities/{activityId}` 🔓 Public

---

### 7.10 活动报名

`POST /api/v1/portal/activities/{activityId}/signup` 🔑 Login

```json
{ "remark": "我司将派3名技术代表参会" }
```

报名前校验：活动是否开放报名（`status=2`）、是否已截止（`reg_deadline`）、是否名额已满（`reg_count >= max_capacity`）、是否已报名（唯一约束）。

---

### 7.11 取消报名

`DELETE /api/v1/portal/activities/{activityId}/signup` 🔑 Login

---

### 7.12 活动管理（管理端）

| 路径 | 方法 | 说明 |
|---|---|---|
| `POST /api/v1/portal/activities` | POST | 创建活动 |
| `PUT /api/v1/portal/activities/{id}` | PUT | 更新活动 |
| `DELETE /api/v1/portal/activities/{id}` | DELETE | 删除活动 |
| `GET /api/v1/portal/activities/{id}/signups` | GET | 报名列表（🛡️ Admin） |
| `PATCH /api/v1/portal/activities/{id}/signups/{signupId}` | PATCH | 更新签到状态（🛡️ Admin） |

---

## 8. 标签模块（gl-tag）

### 8.1 获取标签树（全量）

`GET /api/v1/tags` 🔓 Public

响应结果由 Redis 缓存（TTL 60min），标签变更时自动失效。

#### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "code": "INDUSTRY",
      "name": "行业分类",
      "tags": [
        { "id": 101, "name": "新能源", "alias": "可再生能源,清洁能源", "sortOrder": 1 },
        { "id": 102, "name": "节能环保", "alias": "环保,绿色制造", "sortOrder": 2 },
        { "id": 103, "name": "绿色建筑", "sortOrder": 3 }
      ]
    },
    {
      "id": 2,
      "code": "TECH_FIELD",
      "name": "技术领域",
      "tags": [
        { "id": 201, "name": "光伏", "sortOrder": 1 },
        { "id": 202, "name": "储能", "sortOrder": 2 },
        { "id": 203, "name": "氢能", "sortOrder": 3 }
      ]
    }
  ],
  "timestamp": 1717380000000
}
```

---

### 8.2 标签分类与标签 CRUD（管理端）

| 路径 | 方法 | 权限 | 说明 |
|---|---|---|---|
| `GET /api/v1/tag-categories` | GET | 🔓 | 分类列表（含子标签） |
| `POST /api/v1/tag-categories` | POST | ⚡ | 创建标签分类 |
| `PUT /api/v1/tag-categories/{id}` | PUT | ⚡ | 更新标签分类 |
| `DELETE /api/v1/tag-categories/{id}` | DELETE | ⚡ | 删除分类（需先清空子标签） |
| `GET /api/v1/tags` | GET | 🔓 | 标签分页列表（支持 categoryId/keyword 过滤） |
| `GET /api/v1/tags/{id}` | GET | 🔓 | 标签详情 |
| `POST /api/v1/tags` | POST | ⚡ | 创建标签 |
| `PUT /api/v1/tags/{id}` | PUT | ⚡ | 更新标签 |
| `DELETE /api/v1/tags/{id}` | DELETE | ⚡ | 删除标签（软删除） |

**创建标签请求：**

```json
{
  "categoryId": 1,
  "name": "碳捕集",
  "alias": "CCUS,碳汇",
  "sortOrder": 10
}
```

---

### 8.3 业务标签关联（服务内部调用）

> 由各业务服务通过 OpenFeign 调用，不经过 Gateway 鉴权。

| 路径 | 方法 | 说明 |
|---|---|---|
| `GET /api/v1/tag-relations?bizType=&bizId=` | GET | 查询业务实体的标签列表 |
| `POST /api/v1/tag-relations/batch` | POST | 批量设置（先清空再写入，事务内） |
| `DELETE /api/v1/tag-relations?bizType=&bizId=` | DELETE | 清空业务实体的所有标签 |

**bizType 枚举值：** `RESOURCE` / `DEMAND` / `MEMBER` / `ARTICLE` / `ACTIVITY`

**批量设置请求（POST /batch）：**

```json
{
  "bizType": "MEMBER",
  "bizId": 100,
  "tagIds": [101, 205, 307]
}
```

---

## 9. 消息通知模块（gl-message）

### 9.1 获取消息列表

`GET /api/v1/messages` 🔑 Login

#### 查询参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `channel` | string | SITE/WECHAT，不传返回 SITE 站内信 |
| `bizType` | string | MATCH/AUDIT/ACTIVITY/SYSTEM |
| `isRead` | boolean | true 已读 / false 未读 |
| `page` / `size` | integer | 分页 |

#### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "records": [
      {
        "id": 90001,
        "bizType": "MATCH",
        "bizId": 5001,
        "title": "您的对接申请已被接受",
        "content": "山东绿能科技有限公司已接受您的对接申请，请尽快与对方沟通",
        "channel": "SITE",
        "isRead": false,
        "createdAt": "2026-06-03T10:30:00+08:00"
      }
    ],
    "total": 15,
    "page": 1,
    "size": 20,
    "pages": 1
  },
  "timestamp": 1717380000000
}
```

---

### 9.2 未读消息数

`GET /api/v1/messages/unread-count` 🔑 Login

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 7,
    "match": 3,
    "audit": 2,
    "activity": 1,
    "system": 1
  },
  "timestamp": 1717380000000
}
```

---

### 9.3 标记消息已读

`PATCH /api/v1/messages/{messageId}/read` 🔑 Login

---

### 9.4 全部标记已读

`PATCH /api/v1/messages/read-all` 🔑 Login

```json
{ "bizType": "MATCH" }
```

`bizType` 为可选，不传则全部标记已读。

---

## 10. 文件上传模块（gl-file）

### 10.1 上传文件

`POST /api/v1/files/upload` 🔑 Login

**Content-Type**: `multipart/form-data`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `file` | binary | 是 | 文件内容 |
| `bizType` | string | 否 | 业务类型（RESOURCE/DEMAND/MEMBER/ARTICLE/AVATAR），用于存储路径分类 |

**限制规则：**
- 单文件最大 **20MB**
- 允许的文件类型：`image/jpeg`、`image/png`、`image/gif`、`image/webp`、`application/pdf`、`application/msword`、`application/vnd.openxmlformats-officedocument.wordprocessingml.document`、`application/vnd.ms-excel`、`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`、`video/mp4`
- 文件名在服务端重命名为 UUID，禁止原始文件名作为存储路径

#### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "fileId": 80001,
    "fileName": "技术方案说明书.pdf",
    "fileUrl": "https://cdn.greenlink.com/files/2026/06/a3f2b1c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d.pdf",
    "fileSize": 2048000,
    "mimeType": "application/pdf"
  },
  "timestamp": 1717380000000
}
```

---

### 10.2 获取文件预签名 URL

`GET /api/v1/files/{fileId}/presigned-url` 🔑 Login

用于私有存储桶文件的临时访问，URL 有效期 **1 小时**。

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "fileId": 80001,
    "presignedUrl": "https://minio.greenlink.com/files/a3f2...?X-Amz-Signature=...&X-Amz-Expires=3600",
    "expireAt": "2026-06-03T12:00:00+08:00"
  },
  "timestamp": 1717380000000
}
```

---

### 10.3 OpenAPI 3.0 规范片段（文件上传）

```yaml
/api/v1/files/upload:
  post:
    tags: [文件]
    summary: 上传文件
    operationId: uploadFile
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        multipart/form-data:
          schema:
            type: object
            required: [file]
            properties:
              file:
                type: string
                format: binary
                description: "文件内容，最大 20MB"
              bizType:
                type: string
                enum: [RESOURCE, DEMAND, MEMBER, ARTICLE, AVATAR]
    responses:
      '200':
        description: 上传结果
        content:
          application/json:
            schema:
              allOf:
                - $ref: '#/components/schemas/Result'
                - properties:
                    data:
                      $ref: '#/components/schemas/FileUploadResponse'
```

---

## 附录 A：接口汇总清单

### A.1 认证模块（gl-auth）

| # | 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|---|
| 1 | POST | `/api/v1/auth/login` | 🔓 | 账号密码登录 |
| 2 | POST | `/api/v1/auth/wechat-login` | 🔓 | 微信登录 |
| 3 | POST | `/api/v1/auth/refresh-token` | 🔓 | 刷新 Token |
| 4 | POST | `/api/v1/auth/logout` | 🔑 | 登出 |
| 5 | GET | `/api/v1/auth/captcha` | 🔓 | 获取图形验证码 |
| 6 | POST | `/api/v1/auth/sms-code` | 🔓 | 发送短信验证码 |
| 7 | POST | `/api/v1/auth/change-password` | 🔑 | 修改密码 |

### A.2 会员模块（gl-member）

| # | 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|---|
| 8 | POST | `/api/v1/members/register` | 🔓 | 会员注册 |
| 9 | GET | `/api/v1/members` | 🔓 | 会员列表 |
| 10 | GET | `/api/v1/members/{id}` | 🔓 | 会员详情 |
| 11 | PUT | `/api/v1/members/{id}` | 🔑 | 更新会员信息 |
| 12 | POST | `/api/v1/members/{id}/audit` | 🛡️ | 审核会员 |
| 13 | GET | `/api/v1/members/me` | 🔑 | 我的账号信息 |
| 14 | POST | `/api/v1/members/{id}/sub-accounts` | 🔑 | 创建子账号 |
| 15 | GET | `/api/v1/members/{id}/sub-accounts` | 🔑 | 子账号列表 |
| 16 | PATCH | `/api/v1/members/{id}/sub-accounts/{aid}` | 🔑 | 更新子账号状态 |

### A.3 权限模块（RBAC）

| # | 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|---|
| 17 | GET | `/api/v1/rbac/roles` | 🛡️ | 角色列表 |
| 18 | GET | `/api/v1/rbac/permissions` | 🛡️ | 权限树 |
| 19 | PUT | `/api/v1/rbac/roles/{id}/permissions` | ⚡ | 分配角色权限 |
| 20 | PUT | `/api/v1/rbac/accounts/{id}/roles` | 🛡️ | 分配账号角色 |

### A.4 供需模块（gl-supply）

| # | 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|---|
| 21 | GET | `/api/v1/supply/resources` | 🔓 | 资源列表 |
| 22 | GET | `/api/v1/supply/resources/{id}` | 🔓 | 资源详情 |
| 23 | POST | `/api/v1/supply/resources` | 👤 | 发布资源 |
| 24 | PUT | `/api/v1/supply/resources/{id}` | 👤 | 更新资源 |
| 25 | DELETE | `/api/v1/supply/resources/{id}` | 👤/🛡️ | 下架/删除资源 |
| 26 | POST | `/api/v1/supply/resources/{id}/audit` | 🛡️ | 审核资源 |
| 27 | GET | `/api/v1/supply/resources/mine` | 🔑 | 我的资源列表 |
| 28 | GET | `/api/v1/supply/demands` | 🔓 | 需求列表 |
| 29 | GET | `/api/v1/supply/demands/{id}` | 🔓 | 需求详情 |
| 30 | POST | `/api/v1/supply/demands` | 👤 | 发布需求 |
| 31 | PUT | `/api/v1/supply/demands/{id}` | 👤 | 更新需求 |
| 32 | DELETE | `/api/v1/supply/demands/{id}` | 👤/🛡️ | 关闭/删除需求 |
| 33 | POST | `/api/v1/supply/demands/{id}/audit` | 🛡️ | 审核需求 |
| 34 | GET | `/api/v1/supply/demands/mine` | 🔑 | 我的需求列表 |

### A.5 匹配对接模块（gl-match）

| # | 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|---|
| 35 | GET | `/api/v1/match/recommendations` | 👤 | 智能匹配推荐 |
| 36 | POST | `/api/v1/match/records` | 👤 | 发起对接申请 |
| 37 | GET | `/api/v1/match/records` | 🔑 | 我的对接记录 |
| 38 | GET | `/api/v1/match/records/{id}` | 🔑 | 对接记录详情 |
| 39 | POST | `/api/v1/match/records/{id}/respond` | 🔑 | 响应对接申请 |
| 40 | PATCH | `/api/v1/match/records/{id}/status` | 🔑 | 更新对接状态 |
| 41 | POST | `/api/v1/match/records/{id}/messages` | 🔑 | 发送消息 |
| 42 | GET | `/api/v1/match/records/{id}/messages` | 🔑 | 消息列表 |
| 43 | POST | `/api/v1/match/favorites` | 🔑 | 收藏 |
| 44 | DELETE | `/api/v1/match/favorites` | 🔑 | 取消收藏 |
| 45 | GET | `/api/v1/match/favorites` | 🔑 | 我的收藏 |

### A.6 门户内容模块（gl-portal）

| # | 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|---|
| 46 | GET | `/api/v1/portal/categories` | 🔓 | 栏目列表 |
| 47 | GET | `/api/v1/portal/articles` | 🔓 | 文章列表 |
| 48 | GET | `/api/v1/portal/articles/{id}` | 🔓 | 文章详情 |
| 49 | POST | `/api/v1/portal/articles` | 🛡️ | 发布文章 |
| 50 | PUT | `/api/v1/portal/articles/{id}` | 🛡️ | 更新文章 |
| 51 | DELETE | `/api/v1/portal/articles/{id}` | 🛡️ | 删除文章 |
| 52 | GET | `/api/v1/portal/banners` | 🔓 | 轮播图列表 |
| 53 | GET | `/api/v1/portal/activities` | 🔓 | 活动列表 |
| 54 | GET | `/api/v1/portal/activities/{id}` | 🔓 | 活动详情 |
| 55 | POST | `/api/v1/portal/activities/{id}/signup` | 🔑 | 活动报名 |
| 56 | DELETE | `/api/v1/portal/activities/{id}/signup` | 🔑 | 取消报名 |
| 57 | POST | `/api/v1/portal/activities` | 🛡️ | 创建活动 |
| 58 | PUT | `/api/v1/portal/activities/{id}` | 🛡️ | 更新活动 |
| 59 | DELETE | `/api/v1/portal/activities/{id}` | 🛡️ | 删除活动 |
| 60 | GET | `/api/v1/portal/activities/{id}/signups` | 🛡️ | 报名列表 |
| 61 | PATCH | `/api/v1/portal/activities/{id}/signups/{sid}` | 🛡️ | 更新签到状态 |

### A.7 标签模块（gl-common）

| # | 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|---|
| 62 | GET | `/api/v1/tags` | 🔓 | 标签树（全量含分类） |
| 63 | GET | `/api/v1/tags/categories` | 🛡️ | 标签分类管理列表 |
| 64 | POST | `/api/v1/tags/categories` | ⚡ | 创建标签分类 |
| 65 | PUT | `/api/v1/tags/categories/{id}` | ⚡ | 更新标签分类 |
| 66 | GET | `/api/v1/tags/items` | 🛡️ | 标签管理列表 |
| 67 | POST | `/api/v1/tags/items` | 🛡️ | 创建标签 |
| 68 | PUT | `/api/v1/tags/items/{id}` | 🛡️ | 更新标签 |
| 69 | PATCH | `/api/v1/tags/items/{id}/status` | 🛡️ | 启用/停用标签 |
| 70 | DELETE | `/api/v1/tags/items/{id}` | ⚡ | 删除标签 |

### A.8 消息通知模块（gl-message）

| # | 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|---|
| 71 | GET | `/api/v1/messages` | 🔑 | 消息列表 |
| 72 | GET | `/api/v1/messages/unread-count` | 🔑 | 未读数 |
| 73 | PATCH | `/api/v1/messages/{id}/read` | 🔑 | 标记已读 |
| 74 | PATCH | `/api/v1/messages/read-all` | 🔑 | 全部标记已读 |

### A.9 文件模块（gl-file）

| # | 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|---|
| 75 | POST | `/api/v1/files/upload` | 🔑 | 上传文件 |
| 76 | GET | `/api/v1/files/{id}/presigned-url` | 🔑 | 获取预签名 URL |

**一期接口总计：76 个**

---

## 附录 B：请求头规范

| Header | 必填 | 说明 |
|---|---|---|
| `Authorization` | 鉴权接口必填 | `Bearer <access_token>` |
| `Content-Type` | POST/PUT/PATCH 必填 | `application/json`（文件上传为 `multipart/form-data`） |
| `Accept-Language` | 否 | `zh-CN`（目前仅中文，预留国际化） |
| `X-Request-Id` | 否 | 客户端请求唯一ID，用于链路追踪；服务端原样返回于响应头 |
| `X-App-Type` | 否 | 客户端类型：`PC` / `H5` / `MINIAPP` / `ENTERPRISE_WX` |

---

## 附录 C：数据脱敏规则

| 字段 | 原始值 | 脱敏值 | 触发条件 |
|---|---|---|---|
| 手机号 | `13812345678` | `138****5678` | 未登录或非本单位账号 |
| 邮箱 | `zhang@company.com` | `zha***@company.com` | 未登录或非本单位账号 |
| 姓名 | `张三` | `张*` | 非本单位账号且非管理员 |
| 联系人 | `李四` | `李*` | 同上 |

---

## 附录 D：限流策略

| 接口 | 限流规则 | 超限行为 |
|---|---|---|
| POST `/auth/login` | 同 IP 1分钟 ≤ 30 次 | 返回 `1030` 错误 |
| POST `/auth/sms-code` | 同手机号 1分钟 ≤ 1 次，同 IP 1小时 ≤ 10 次 | 返回 `1030` 错误 |
| POST `/files/upload` | 同账号 1分钟 ≤ 10 次 | 返回 `1030` 错误 |
| 其余 GET 接口 | 同 IP 1秒 ≤ 100 次 | 返回 `1030` 错误 |
| 其余 POST/PUT 接口 | 同账号 1分钟 ≤ 60 次 | 返回 `1030` 错误 |

限流由 Spring Cloud Gateway + Sentinel 实现，令牌桶算法，限流信息存于 Redis。

---

## 11. 变更记录

| 版本 | 日期 | 变更说明 | 变更人 |
|---|---|---|---|
| V1.0 | 2026-06-03 | 初始版本，覆盖一期全量接口（76个） | 架构组 |

---

> **维护说明**：本文档与代码同步更新，接口发生变更时须同步修改此文档并在变更记录中追加说明。  
> 开发环境可通过 Swagger UI 查看在线版本：`http://gateway.dev.greenlink.local/swagger-ui.html`

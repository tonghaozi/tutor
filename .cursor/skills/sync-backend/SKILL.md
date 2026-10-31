---
name: sync-backend
description: >-
  修改同号前端时同步修改 Desktop/web-app 后端，并经宝塔把 jar 发布到服务器 8080。
  在改页面、接口、类型、文案数据、鉴权、列表内容，或用户提到后端、宝塔、部署、web-app、接口时使用。
---

# 前后端一起改

改本仓库时先读本技能。接口、字段、校验、鉴权或接口返回的数据有变化时，同一次任务里改后端并发布到线上，对齐之后才算完成。

面板地址、账号、密码只在同目录的 `credentials.local`。部署前读取。不要把密码写进仓库、提交说明、遗留脚本，或对用户的回复。

## 对照

| 角色 | 位置 |
| --- | --- |
| 前端 | 本仓库 |
| 接口与类型 | `src/api/index.ts`、`src/types` |
| 后端 | `C:/Users/Administrator/Desktop/web-app`（Spring Boot 2.6，Java 8） |
| 路由 | `src/main/java/com/example/tutor/TutorController.java` |
| 业务、表、种子 | `TutorService.java`、`src/main/resources/seed.json` |
| 线上接口 | `https://tonghao520.top/api`（Nginx 反代到本机 8080） |
| 服务器 jar | `/www/javaapi/web-app-0.0.1-SNAPSHOT.jar` |
| 服务器本地配置 | `/www/javaapi/application-local.properties`（含数据库密码，禁止提交、禁止写入回复） |
| 静态站 | `/www/wwwroot/tonghao520.top` |
| 头像目录 | `/www/wwwroot/tonghao520.top/uploads` |
| 面板入口 | 见同目录 `credentials.local`（域名端口，勿用 IP 直连） |

前端生产构建用同源 `/api`；开发环境 `VITE_API_BASE_URL` 指向 `https://tonghao520.top/api`。列表和详情以该接口为准，不要只改 `src/mock` 就结束。

## 步骤

1. 判断本次改动是否改变请求、响应字段、校验、鉴权、库表，或接口返回的文案和数据。
2. 会变：同时改 `web-app`。路径、字段名、状态值与前端类型保持一致。已有数据需要新字段或新种子时，在 `TutorService` 里做兼容，不要假设空库。
3. 用 Java 8 打包（见下方命令）。覆盖上传前先备份服务器上的旧 jar。
4. 用 `credentials.local` 登录宝塔，上传到 `/www/javaapi/web-app-0.0.1-SNAPSHOT.jar`，重启监听 8080 的 Java 项目。
5. 请求 `https://tonghao520.top/api/health`（或本机 `http://127.0.0.1:8080/api/health`）和本次改动对应的接口，确认返回与前端一致。
6. 只有样式、间距、图标变化，且请求和响应不变：不要为了凑改动去改 Java。在结果里写明后端契约未变、未发布新 jar。

登录要点：先打开 `credentials.local` 里的安全入口拿 cookie，再用登录页下发的 RSA 公钥加密用户名和密码（密码按宝塔要求先做 MD5）后提交。含密码的临时脚本在任务结束前删除。

## 打包

本机若已有这些路径就直接用；不存在时再查找 JDK 8 和 Maven，不要换到更高的 Java 版本。

```powershell
$jdk = "C:\Program Files\Eclipse Adoptium\jdk-8.0.504.1-hotspot"
$env:JAVA_HOME = $jdk
$env:PATH = "$jdk\bin;$env:TEMP\apache-maven-3.9.6\bin;$env:PATH"
Set-Location "C:\Users\Administrator\Desktop\web-app"
mvn -q -DskipTests package
Copy-Item "target\web-app-0.0.1-SNAPSHOT.jar" "C:\Users\Administrator\Desktop\baota-upload\web-app.jar" -Force
```

上传这个 jar，远程文件名仍是 `web-app-0.0.1-SNAPSHOT.jar`。

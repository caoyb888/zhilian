# S0-01 交付文档：内网机 Docker 环境初始化 + K8s 单节点部署

> **任务来源**：`sprint-plan.md` Sprint 0 — Story S0-01  
> **执行环境**：内网机（Ubuntu 22.04）  
> **部署日期**：2026-06-04  
> **负责人**：运维-褚（AI 辅助执行）

---

## 一、环境信息

| 项目 | 值 |
|---|---|
| 主机名 | `onlyofficebak` |
| 内网 IP | `10.30.10.49` |
| OS | Ubuntu 22.04.5 LTS |
| Docker | 29.3.1（已预装） |
| Docker Compose | v5.1.1（已预装） |
| K8s 发行版 | k3s v1.29.5+k3s1（容器化运行） |
| Ingress Controller | nginx-ingress-controller v1.9.6 |
| kubeconfig 路径 | `~/.kube/config-greenlink` |

---

## 二、已完成任务清单

### T0-01-1：Docker CE、Docker Compose V2、kubectl 安装

- ✅ Docker CE 29.3.1 — 已就绪
- ✅ Docker Compose V2 (v5.1.1) — 已就绪
- ✅ kubectl v1.29.5+k3s1 — 已安装至 `~/.local/bin/kubectl`

### T0-01-2：单节点 K8s（k3s）部署 + CNI 配置

- ✅ 通过 Docker 运行 k3s server 单节点集群
- ✅ Flannel VXLAN CNI 已自动配置（Pod CIDR: `10.42.0.0/24`）
- ✅ Service CIDR: `10.43.0.0/16`
- ✅ TLS SAN 已配置为内网 IP `10.30.10.49`

### T0-01-3：Nginx Ingress Controller 部署 + 路由验证

- ✅ 已禁用 k3s 默认 Traefik（`--disable=traefik`）
- ✅ Nginx Ingress Controller v1.9.6 已部署至 `ingress-nginx` 命名空间
- ✅ IngressClass `nginx` 已创建
- ✅ Service 类型为 NodePort：`80→30080`，`443→30443`
- ✅ 测试路由验证通过（`greenlink-test.local → nginx 欢迎页`）

### T0-01-4：kubectl 配置 + 集群健康验证

- ✅ kubeconfig 已提取并配置（`~/.kube/config-greenlink`）
- ✅ 节点状态：`onlyofficebak Ready`
- ✅ 核心组件运行正常：coredns、local-path-provisioner、metrics-server

### T0-01-5：Namespace 隔离方案（dev/test/prod）

- ✅ `greenlink-dev` — 开发联调环境（含 ResourceQuota / LimitRange）
- ✅ `greenlink-test` — 测试/集成环境（含 ResourceQuota / LimitRange）
- ✅ `greenlink-prod` — 生产环境（一期预留）

---

## 三、快速使用指南

### 3.1 加载环境变量

```bash
export KUBECONFIG=~/.kube/config-greenlink
kubectl get nodes
```

### 3.2 查看 Ingress Controller 状态

```bash
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

### 3.3 测试 Ingress 路由

```bash
# 方式一：本地 hosts 映射 + 浏览器访问
#   10.30.10.49  greenlink-test.local
#   然后访问 http://greenlink-test.local:30080/

# 方式二：命令行直接测试
curl -H "Host: greenlink-test.local" http://10.30.10.49:30080/
```

### 3.4 清理测试资源（可选）

```bash
kubectl delete -f infra/k3s/test-ingress.yaml
```

---

## 四、关键部署文件清单

| 文件 | 说明 |
|---|---|
| `infra/k3s/ingress-nginx.yaml` | Nginx Ingress Controller 部署清单 |
| `infra/k3s/namespaces.yaml` | Namespace + ResourceQuota + LimitRange |
| `infra/k3s/test-ingress.yaml` | Ingress 路由验证测试应用 |
| `infra/README-S0-01.md` | 本交付文档 |

---

## 五、验收标准对照

| 验收项 | 状态 | 验证命令/方式 |
|---|---|---|
| `kubectl get nodes` 显示 Ready | ✅ 通过 | `kubectl get nodes` → `onlyofficebak Ready` |
| Nginx Ingress 可正常路由测试请求 | ✅ 通过 | `curl -H "Host: greenlink-test.local" http://10.30.10.49:30080/` 返回 nginx 欢迎页 |
| dev、test Namespace 创建完毕 | ✅ 通过 | `kubectl get ns -l app.greenlink.io/project=greenlink` |

---

## 六、注意事项

1. **镜像拉取策略**：当前环境对外网 Docker Hub 访问受限，k3s 内部 containerd 已通过 `registries.yaml` 配置 DaoCloud 镜像代理（`docker.m.daocloud.io`）。如后续部署业务 Pod 遇到镜像拉取失败，请确认镜像在代理仓库中可用，或手动导入。

2. **Ingress 端口**：由于宿主机 80/443 已被占用，Ingress Controller 使用 NodePort `30080/30443` 对外暴露。生产环境如需标准端口，请释放宿主机 80/443 或增加一层反向代理。

3. **持久化存储**：当前使用 k3s 自带的 `local-path-provisioner`，数据存储在宿主机 `/var/lib/rancher/k3s/storage/` 下。如需更高可用性，后续应接入 NFS / Longhorn / Rook-Ceph 等存储方案。

4. **k3s 容器重启**：k3s 以 Docker 容器方式运行（`--network host`）。如宿主机重启，需手动执行 `docker start k3s-server` 或配置 systemd/docker 自动重启策略。

---

*本文档由 AI 辅助生成，实际运维操作请根据内网机具体情况复核。*

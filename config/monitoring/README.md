# LKVIP GROUP — Monitoring Stack Setup Guide
# Ubuntu 22.04 LTS, bare-metal (no Docker)

## Overview

The monitoring stack consists of three components installed directly on the VPS:

| Component | Version | Port | Purpose |
|-----------|---------|------|---------|
| **Prometheus** | 2.x | 9090 | Scrapes metrics, evaluates alert rules |
| **Grafana** | 10.x | 3000 | Visualize metrics, dashboards |
| **Node Exporter** | 1.x | 9100 | OS-level metrics (CPU, disk, memory, network) |

The LKVIP Backend already exposes Prometheus metrics at `GET /metrics` (port 5000).

---

## Quick Install

Run as root on your Ubuntu VPS:

```bash
# 1. Update package list
apt-get update

# 2. Install Prometheus + Node Exporter
apt-get install -y prometheus prometheus-node-exporter

# 3. Add Grafana APT repository
apt-get install -y apt-transport-https software-properties-common wget
wget -q -O - https://packages.grafana.com/gpg.key | apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" \
  > /etc/apt/sources.list.d/grafana.list
apt-get update
apt-get install -y grafana

# 4. Enable and start all services
systemctl enable prometheus prometheus-node-exporter grafana-server
systemctl start  prometheus prometheus-node-exporter grafana-server
```

---

## Configure Prometheus

```bash
# Copy LKVIP config (overwrites default)
cp config/monitoring/prometheus.yml /etc/prometheus/prometheus.yml

# Copy alert rules
cp config/monitoring/prometheus/alerts.yml /etc/prometheus/alerts.yml

# Validate config
promtool check config /etc/prometheus/prometheus.yml

# Reload Prometheus (no restart needed)
systemctl reload prometheus
```

Verify Prometheus is scraping the backend:
```
http://localhost:9090/targets
# Should show lkvip-backend as "UP" (state: green)
```

---

## Configure Grafana

### 1. Copy provisioning files

```bash
# Datasource (auto-creates Prometheus connection)
cp config/monitoring/grafana/provisioning/datasources/prometheus.yml \
   /etc/grafana/provisioning/datasources/lkvip-prometheus.yml

# Dashboard provisioning (auto-loads JSON dashboards)
cp config/monitoring/grafana/provisioning/dashboards/dashboard.yml \
   /etc/grafana/provisioning/dashboards/lkvip.yml

# Create dashboards directory
mkdir -p /var/lib/grafana/dashboards

# Restart Grafana to pick up provisioning
systemctl restart grafana-server
```

### 2. Access Grafana

```
URL:      http://YOUR_VPS_IP:3000
Username: admin
Password: admin   ← change immediately!
```

### 3. Change admin password

```bash
grafana-cli admin reset-admin-password NEW_SECURE_PASSWORD
systemctl restart grafana-server
```

---

## Nginx Proxy for Grafana (recommended)

Add this server block to your Nginx config to expose Grafana at `https://monitoring.yourdomain.com`:

```nginx
server {
    listen 443 ssl http2;
    server_name monitoring.yourdomain.com;

    # SSL (managed by certbot)
    ssl_certificate     /etc/letsencrypt/live/monitoring.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monitoring.yourdomain.com/privkey.pem;

    # Restrict to your IP only (recommended)
    # allow 1.2.3.4;   # Your office/home IP
    # deny all;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Then add SSL: `certbot --nginx -d monitoring.yourdomain.com --email admin@yourdomain.com`

---

## Metrics Reference

The LKVIP backend exposes these Prometheus metrics at `GET /metrics`:

| Metric | Type | Description |
|--------|------|-------------|
| `lkvip_requests_total` | Counter | Total HTTP requests handled |
| `lkvip_errors_total` | Counter | Total 5xx errors returned |
| `lkvip_process_uptime_seconds` | Gauge | Seconds since process started |
| `lkvip_memory_rss_bytes` | Gauge | RSS memory in bytes |
| `lkvip_memory_heap_used_bytes` | Gauge | V8 heap used in bytes |
| `lkvip_memory_heap_total_bytes` | Gauge | V8 heap total allocated in bytes |

Node Exporter additionally provides hundreds of OS-level metrics (prefixed `node_`).

---

## Alert Rules

Alert rules are defined in [`prometheus/alerts.yml`](prometheus/alerts.yml):

| Alert | Severity | Condition | Duration |
|-------|----------|-----------|----------|
| `LKVIPServiceDown` | critical | `up{job="lkvip-backend"} == 0` | 2 minutes |
| `LKVIPHighErrorRate` | warning | error rate > 0.1/sec (~6/min) | 5 minutes |
| `LKVIPHighMemoryUsage` | warning | RSS > 350MB | 10 minutes |
| `LKVIPHeapNearLimit` | warning | heap used > 80% of heap total | 5 minutes |
| `NodeExporterDown` | warning | node-exporter unreachable | 5 minutes |
| `DiskSpaceLow` | warning | root partition < 15% free | 10 minutes |
| `HighCPULoad` | warning | CPU > 85% | 15 minutes |

### (Optional) Alertmanager for email/Slack notifications

```bash
apt-get install -y prometheus-alertmanager
# Configure /etc/prometheus/alertmanager.yml with your SMTP or Slack webhook
# Then uncomment the alerting: section in prometheus.yml
```

---

## Useful Commands

```bash
# Check Prometheus status
systemctl status prometheus
curl -s http://localhost:9090/-/healthy

# Check active alerts
curl -s http://localhost:9090/api/v1/alerts | python3 -m json.tool

# Check scrape targets
curl -s http://localhost:9090/api/v1/targets | python3 -m json.tool

# Check Node Exporter
curl -s http://localhost:9100/metrics | head -20

# Check backend /metrics
curl -s http://localhost:5000/metrics

# View Grafana logs
journalctl -u grafana-server -f

# View Prometheus logs
journalctl -u prometheus -f
```

---

## File Structure

```
config/monitoring/
├── prometheus.yml                          # Main Prometheus config (copy to /etc/prometheus/)
├── prometheus/
│   └── alerts.yml                          # Alert rules (copy to /etc/prometheus/)
├── grafana/
│   └── provisioning/
│       ├── datasources/
│       │   └── prometheus.yml              # Auto-creates Prometheus datasource
│       └── dashboards/
│           └── dashboard.yml               # Auto-loads JSON dashboards
└── README.md                               # This file
```

#!/usr/bin/env bash
set -Eeo pipefail

# 初始化数据库
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "Initializing PostgreSQL database..."
    initdb -D "$PGDATA"

    # 配置监听地址和访问控制
    cat > "$PGDATA/postgresql.conf" << EOF
listen_addresses = '*'
max_connections = 100
shared_buffers = 128MB
EOF

    # 配置客户端认证
    cat > "$PGDATA/pg_hba.conf" << EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all            all                                     trust
host    all            all             127.0.0.1/32           trust
host    all            all             ::1/128                trust
host    all            all             0.0.0.0/0              trust
host    all            all             ::/0                   trust
EOF

    # 启动PostgreSQL服务
    pg_ctl -D "$PGDATA" -w start

    # 创建数据库和扩展
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
        CREATE DATABASE $POSTGRES_DB;
EOSQL

    # 切换到目标数据库
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        CREATE EXTENSION IF NOT EXISTS zhparser;
        CREATE TEXT SEARCH CONFIGURATION chinese (PARSER = zhparser);
        ALTER TEXT SEARCH CONFIGURATION chinese ADD MAPPING FOR n,v,a,i,e,l WITH simple;
EOSQL

    # 执行初始化脚本
    echo "Running initialization scripts..."
    for f in /docker-entrypoint-initdb.d/*.sql; do
        echo "Executing $f..."
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
    done

    # 停止PostgreSQL服务
    pg_ctl -D "$PGDATA" -m fast -w stop
fi

# 启动PostgreSQL服务
exec postgres -D "$PGDATA"
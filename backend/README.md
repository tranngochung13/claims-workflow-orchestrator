# Backend — Windows, macOS và Linux

- Windows 10/11: phần PowerShell ngay bên dưới.
- [macOS và Linux: Terminal zsh/bash](#macos-va-linux).
- [Workflow scenarios](../docs/demo-scenarios.md): giữ nguyên các kịch bản nghiệp vụ.

## Windows 10/11 — PowerShell

Dùng Windows PowerShell **5.1** hoặc PowerShell **7**, không cần Git Bash/WSL.
Terminal 1 chạy server; Terminal 2 gửi requests. Các khối lệnh trong phần Windows là
PowerShell. Không cần Nest CLI toàn cục hay SQLite server.

## 1. Nguyên nhân hướng dẫn cũ thất bại

Hướng dẫn cũ dùng export, mktemp, lsof, heredoc và cú pháp biến của bash/zsh.
PowerShell không chạy chúng tương đương. Trong PowerShell 5.1, curl còn có thể là
alias của Invoke-WebRequest, không nhận flags như curl Unix. Hướng dẫn mới dùng
cmdlet HTTP trực tiếp, hashtable headers và ConvertTo-Json.

Backend không tự nạp .env; chỉ đọc process.env. Thiếu NODE_ENV=development hoặc
DEMO_IDENTITY_ENABLED=true khiến claim API trả 403 dù GET / vẫn trả 200.
Scripts npm hiện tại không chứa cú pháp đặt biến riêng Unix, nên không cần sửa
script hoặc thêm cross-env. SQLite dùng node:path/fileURLToPath, hỗ trợ đường dẫn
Windows. Không có stack trace Windows được cung cấp: đây là các điểm không tương
thích xác nhận từ source/hướng dẫn, không phải kết quả tái hiện trên Windows.

## 2. Điều kiện và phiên bản — Terminal 1

- Chọn **Node.js 22.22.3 Windows x64**, hoặc bản mới hơn trong nhánh 22.x. Đây là
  mức đáp ứng engine của toolchain trong lockfile hiện tại. Không dùng Node 16/18;
  Node 22.15.1 thấp hơn yêu cầu một số công cụ dù từng chạy được trên macOS.
- npm đi kèm Node; lockfileVersion=3. Toolchain được đối chiếu chấp nhận npm >=8;
  dự án không pin bản npm chính xác hoặc khai báo engines riêng. Không đổi sang
  Yarn/pnpm. npm 10.9.2 là bản có sẵn được dùng kiểm tra trên macOS.
- PowerShell 5.1/7, Git for Windows (dự án không pin bản Git), mạng để cài package,
  quyền ghi thư mục database. Windows ARM64/native binding cần xác minh riêng.
- better-sqlite3 là native module: nếu không tải được binary phù hợp thì cần Python
  và Visual Studio Build Tools với workload C++; không thêm dependency dự án.

Mở PowerShell thường, không cần Administrator:

```powershell
$ErrorActionPreference = 'Stop'
$PSVersionTable.PSVersion
node --version
npm.cmd --version
git --version
```

Mong đợi phiên bản như trên, mọi lệnh chạy được. Nếu sai/không tìm thấy, cài công
cụ phù hợp, mở Terminal mới và kiểm tra PATH:

```powershell
Get-Command node, npm.cmd, git
where.exe node
```

Dùng npm.cmd tránh execution policy chặn npm.ps1; không cần nới policy toàn máy.

## 3. Clone và cài — Terminal 1

Từ thư mục người dùng Windows, dùng URL trong Git remote của repository:

```powershell
Set-Location $env:USERPROFILE
git clone https://github.com/tranngochung13/claims-workflow-orchestrator.git
if ($LASTEXITCODE -ne 0) { throw 'Clone failed; check URL, network and repository access.' }
Set-Location (Join-Path $env:USERPROFILE 'claims-workflow-orchestrator\backend')
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Install failed; fix the error before starting.' }
```

Mong đợi clone thành công, working directory là backend và npm ci exit 0. Nếu đã
có checkout, không xóa/clone đè: Set-Location tới backend của checkout đó rồi npm.cmd
ci. URL/quyền clone cần kiểm tra trên máy bạn; lần sửa tài liệu này không clone lại.

npm ci cài đúng lockfile, thay node_modules, không tạo database. Không copy
node_modules từ macOS/Linux hay Node khác sang Windows. Cài và chạy cùng runtime.

## 4. Chọn database — Terminal 1, tại backend

Chỉ chọn **A hoặc B**. Biến ở Terminal 1 không tự xuất hiện trong Terminal 2.

### A. Cài mới/demo: đường dẫn mới, không đụng database hiện có

```powershell
$demoDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ('claims-demo-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $demoDirectory -ErrorAction Stop | Out-Null
$env:SQLITE_DATABASE_PATH = Join-Path $demoDirectory 'claims.sqlite'
if (Test-Path -LiteralPath $env:SQLITE_DATABASE_PATH) { throw 'Refusing to initialize an existing path.' }
Write-Output "New demo database: $env:SQLITE_DATABASE_PATH"
```

Mong đợi path tuyệt đối mới, chưa có claims.sqlite; không dùng -Force. Backend sẽ
khởi tạo file và migrations khi startup, không phải lúc New-Item. Giữ lại path nếu
muốn dùng lại dữ liệu. Thư mục temp có thể bị hệ điều hành dọn, không dùng lưu dữ
liệu quan trọng lâu dài. Tạo demo khác bằng thư mục mới, không xóa database cũ.

### B. Dùng database hiện có, không khởi tạo lại

Tại backend, với database mặc định của checkout:

```powershell
$existingDatabase = Join-Path (Get-Location).Path 'data\claims.sqlite'
if (-not (Test-Path -LiteralPath $existingDatabase -PathType Leaf)) { throw 'Existing database not found; verify its actual location.' }
$env:SQLITE_DATABASE_PATH = (Resolve-Path -LiteralPath $existingDatabase).Path
Write-Output "Existing database: $env:SQLITE_DATABASE_PATH"
```

Nếu trước đó dùng path khác, thay $existingDatabase bằng path thật trước khi kiểm
tra. Không trỏ tới file không tồn tại để “khôi phục” dữ liệu. Startup trên DB cũ có
thể áp dụng migrations còn thiếu và đăng ký workflow mới: **không phải chỉ đọc**.
Backup SQLite nhất quán trước nâng cấp dữ liệu quan trọng; không chỉ copy file
chính khi WAL/writer còn hoạt động. Không reset/ghi đè database.

### Cơ chế thực tế

- Không đặt SQLITE_DATABASE_PATH: mặc định backend/data/claims.sqlite, tính theo
  module source/dist. Trong test mode, không override thì dùng :memory:.
- Path rỗng/toàn khoảng trắng bị từ chối; parent directory được tạo đệ quy. Path
  tương đối theo working directory; nên dùng path tuyệt đối như trên. Không đưa
  ký tự nháy bao quanh vào chính giá trị biến môi trường.
- Migrations 001–005 trong src/database/migrations.ts tự chạy trước HTTP listen.
  Không có script migrate/seed/reset. schema_migrations lưu ID/SHA-256 SQL, phải
  khớp prefix chính xác; mismatch dừng với MIGRATION_DRIFT. Pending migrations
  chạy trong transaction; lỗi rollback phần đang chờ, không sửa checksum cũ.
- Foreign keys, WAL, synchronous=FULL, timeout 5 giây; cần quyền ghi cạnh file để
  tạo WAL/SHM. Tránh thư mục chỉ đọc/network share cho lần setup local.
- config/claims.v2.json và workflow.schema.json được validate trước mở DB. Registry
  bất biến, claim cũ giữ version đã pin. Migration 005 thêm local payment records,
  không chuyển tiền thật. Không sửa applied migrations hay nội dung version cũ.

## 5. Cấu hình và chạy — Terminal 1, tại backend

```powershell
$env:PORT = '31879'
$env:NODE_ENV = 'development'
$env:DEMO_IDENTITY_ENABLED = 'true'
$listeners = @(Get-NetTCPConnection -State Listen -LocalPort ([int]$env:PORT) -ErrorAction SilentlyContinue)
if ($listeners.Count -gt 0) {
    $listeners | Select-Object LocalAddress, LocalPort, OwningProcess
    throw 'Port occupied. Choose another PORT; do not POST to an unknown server.'
}
Write-Output "PORT=$env:PORT NODE_ENV=$env:NODE_ENV DEMO_IDENTITY_ENABLED=$env:DEMO_IDENTITY_ENABLED"
Write-Output "SQLITE_DATABASE_PATH=$env:SQLITE_DATABASE_PATH"
npm.cmd run start:dev
```

Mong đợi compiler không lỗi, routes được đăng ký và listen thành công. start:dev là
nest start --watch, không cần build trước. Giữ Terminal 1 mở. Nếu EADDRINUSE/startup
error, không gửi POST: có thể server khác đang trả lời. Chọn PORT khác, restart và
đổi URL Terminal 2. Nếu cmdlet kiểm tra port bị chặn/không có, cần kiểm chứng cổng
bằng công cụ Windows trước khi gửi requests ghi dữ liệu.

Không tự đọc .env. PORT mặc định 3000, chưa validate riêng: dùng chuỗi số hợp lệ.
Demo cần đồng thời đúng development và true, phân biệt chữ hoa/thường. Không có
payment credentials. API_PROXY_TARGET là biến Vite frontend, không phải backend.
Observe đang có credential placeholder trong source, không có env Observe do app
định nghĩa. Không commit secrets/local env files; hướng dẫn này không tạo .env.

app.listen không giới hạn bind host; URL loopback không có nghĩa chỉ listen loopback.
Chỉ bật demo trong local tin cậy, không mở ra Internet. Production luôn từ chối
claim API demo, kể cả DEMO_IDENTITY_ENABLED=true; chưa có auth adapter production.

## 6. Kiểm tra server — Terminal 2

Mở PowerShell mới, vào backend của cùng checkout (đổi path nếu clone ở nơi khác):

```powershell
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $env:USERPROFILE 'claims-workflow-orchestrator\backend')
$baseUrl = 'http://127.0.0.1:31879'
$response = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing
$response.StatusCode
$response.Content
```

Mong đợi **200**, văn bản **Hello World!**, không phải JSON. Không có /health hay
/api/health. App khởi tạo DB/registry trước listen; GET / không phải continuous DB
health check. Nếu khác, đọc Terminal 1/đối chiếu cổng; phải chắc phiên của bạn không
báo EADDRINUSE trước khi làm bước tạo claim.

## 7. Demo identities và API — Terminal 2

| Header X-Demo-Actor-Id | Quyền |
| --- | --- |
| claimant-1 | Tạo claim, xem/action claim mình sở hữu. |
| claimant-2 | Claimant khác, tập dữ liệu sở hữu riêng. |
| adjuster-1 | Xem mọi claim, action adjuster; không tạo claim. |

Đây là impersonation demo, không phải authentication production. Role và owner do
backend allowlist xác định; không gửi role/actor/owner trong body.

### Liệt kê claims

```powershell
$claimantHeaders = @{ 'X-Demo-Actor-Id' = 'claimant-1' }
$adjusterHeaders = @{ 'X-Demo-Actor-Id' = 'adjuster-1' }
$response = Invoke-WebRequest -Uri "$baseUrl/api/claims?limit=10&offset=0" -Headers $claimantHeaders -UseBasicParsing
$response.StatusCode
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "$baseUrl/api/claims?limit=10&offset=0" -Headers $adjusterHeaders
```

Mong đợi **200**, object items/limit/offset; DB mới có items=[]. Adjuster xem mọi
owner. limit 1–100 (mặc định 50), offset nguyên không âm (mặc định 0). 401/403: kiểm
tra header và env ở Terminal 1, không sửa guard để vượt lỗi.

### Tạo claim — chỉ trên database demo mới

```powershell
$payload = @{ title = 'Hu hong man hinh'; description = 'Man hinh hong khi van chuyen.' } | ConvertTo-Json -Compress
$response = Invoke-WebRequest -Uri "$baseUrl/api/claims" -Method Post -Headers $claimantHeaders -ContentType 'application/json' -Body $payload -UseBasicParsing
$response.StatusCode
$claim = $response.Content | ConvertFrom-Json
if (-not $claim.id) { throw 'No claim ID; stop and inspect the response.' }
$claimId = $claim.id
$claim | ConvertTo-Json -Depth 10
```

Mong đợi **201**, UUID thật, ownerActorId=claimant-1, workflowId=claims,
workflowVersion=2, state=draft, revision=0, informationRequestCount=0, title,
description, createdAt/updatedAt UTC. Chỉ nhận title/description không rỗng, tối đa
120/2000 ký tự; trường thừa bị từ chối. Nếu lỗi, dừng trước khi dùng $claimId.
Không tự retry tạo claim khi outcome chưa rõ: endpoint này chưa deduplicate command.

### Detail, discovery, audit

```powershell
$response = Invoke-WebRequest -Uri "$baseUrl/api/claims/$claimId" -Headers $claimantHeaders -UseBasicParsing
$response.StatusCode
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

$response = Invoke-WebRequest -Uri "$baseUrl/api/claims/$claimId/available-transitions" -Headers $claimantHeaders -UseBasicParsing
$response.StatusCode
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

$response = Invoke-WebRequest -Uri "$baseUrl/api/claims/$claimId/audit?limit=10&offset=0" -Headers $claimantHeaders -UseBasicParsing
$response.StatusCode
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

Mong đợi cả ba **200**. Detail trả claim object; discovery có claimId, workflowId,
workflowVersion, state, revision, informationRequestCount/Limit và transitions
(draft có submit eligible). Audit có metadata workflow, items/limit/offset; claim
mới items=[]. Detail/discovery không nhận query, audit chỉ limit/offset.
Claim khác owner trả 404 giống claim không tồn tại; audit không có API sửa/xóa.
Nếu lỗi, xem bảng troubleshooting trước khi gọi lại.

## 8. Kiểm tra SQLite chỉ đọc — Terminal 2, tại backend

Nhập đúng path được Terminal 1 in; không chạy lại bước tạo database mới ở Terminal 2:

```powershell
$env:SQLITE_DATABASE_PATH = Read-Host 'Paste absolute database path from Terminal 1, without surrounding quotes'
if (-not (Test-Path -LiteralPath $env:SQLITE_DATABASE_PATH -PathType Leaf)) { throw 'Database does not exist; do not create a replacement.' }
@'
import Database from 'better-sqlite3';
const db = new Database(process.env.SQLITE_DATABASE_PATH, { readonly: true, fileMustExist: true });
try {
  db.pragma('query_only = ON');
  console.log('quick_check:', db.pragma('quick_check', { simple: true }));
  console.log('foreign_key_check:', db.pragma('foreign_key_check'));
  console.log('migrations:', db.prepare('SELECT id FROM schema_migrations ORDER BY id').all());
} finally { db.close(); }
'@ | node --input-type=module
if ($LASTEXITCODE -ne 0) { throw 'Read-only check failed.' }
```

Mong đợi quick_check: ok, foreign_key_check: [], migrations 001–005 sau startup.
DB cũ chưa nâng cấp có thể chỉ 001–004: không sửa ledger để ép khớp. Không dùng
DatabaseService constructor để kiểm tra chỉ đọc, vì nó áp dụng migrations.

## 9. Tests và build — tại backend

Terminal 2: bỏ override DB trong phiên test, không đổi env server ở Terminal 1:

```powershell
Remove-Item Env:SQLITE_DATABASE_PATH -ErrorAction SilentlyContinue
npm.cmd test
if ($LASTEXITCODE -ne 0) { throw 'Unit tests failed.' }
npm.cmd run test:e2e
if ($LASTEXITCODE -ne 0) { throw 'E2E tests failed.' }
npm.cmd run lint
if ($LASTEXITCODE -ne 0) { throw 'Lint failed.' }
& '.\node_modules\.bin\tsc.cmd' -p tsconfig.json --noEmit --incremental false
if ($LASTEXITCODE -ne 0) { throw 'TypeScript check failed.' }
```

Mong đợi tests passed, exit 0. Tests dùng memory/DB tạm; E2E cần socket local.
Nếu lỗi, giữ nguyên kiểm tra bảo mật và sửa nguyên nhân. **Dừng watch ở Terminal 1
bằng Ctrl+C trước khi build**, tránh cùng ghi dist/compiler cache:

```powershell
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
```

Mong đợi tạo dist không lỗi compiler. Các scripts khác:

| npm.cmd command | Chức năng |
| --- | --- |
| start | nest start, không watch. |
| run start:debug | Watch với debugger, chỉ local. |
| run start:prod | node dist/main; build trước, giữ config/ cạnh dist/. |
| run test:watch / run test:cov / run test:debug | Vitest watch, coverage, inspector. |
| run format | Prettier ghi lại source/tests, không cần setup. |
| run deploy | nest deploy, ngoài phạm vi local; chưa xác minh cấu hình/quyền deploy. |

Production sau build, Terminal 1 tại backend với database đã chọn:

```powershell
$env:NODE_ENV = 'production'
$env:DEMO_IDENTITY_ENABLED = 'false'
npm.cmd run start:prod
```

GET / phải trả 200, claim API phải trả 403 DEMO_IDENTITY_DISABLED. Không đổi sang
development rồi gọi đó là production. Nest build không copy workflow JSON: giữ
config/ cùng cấp dist/. Muốn quay lại demo, dừng production, đặt lại hai biến demo
bằng $env: rồi npm.cmd run start:dev.

## 10. Troubleshooting

PowerShell 5.1 cmdlet HTTP ném exception với 4xx/5xx. Đọc HTTP status và ErrorDetails;
đó không phải bằng chứng cmdlet không hỗ trợ API. Lỗi nghiệp vụ thường có dạng
{ "error": { "code": "...", "message": "..." } }.

| Triệu chứng | Xử lý |
| --- | --- |
| npm.ps1 bị chặn | Dùng npm.cmd; không nới execution policy toàn máy. |
| export/mktemp/lsof không tìm thấy hoặc curl flags sai | Dùng các khối PowerShell ở đây, không copy lệnh Unix. |
| EBADENGINE/module syntax error | Kiểm tra node --version/Get-Command/where.exe node; chọn Node 22.22.3+, mở Terminal mới, npm.cmd ci với cùng runtime. |
| better-sqlite3 ABI/NODE_MODULE_VERSION | Không copy node_modules từ OS/Node khác; npm.cmd ci bằng đúng Windows Node đang chạy. |
| node-gyp/native build fail | Đọc lỗi network/proxy trước. Nếu cần compile, cài Python/Visual Studio Build Tools C++ rồi mở Terminal mới và npm.cmd ci. Không bảo đảm mọi kiến trúc có prebuilt binary. |
| Missing script: start:dev | Sai working directory; vào backend có package.json. |
| EADDRINUSE | Xem Get-NetTCPConnection -State Listen -LocalPort 31879; dùng Get-Process -Id với OwningProcess đã in. Không kill process lạ. Chọn PORT khác, restart, đổi $baseUrl. |
| Connection refused | Xem Terminal 1 và cổng; log NestApplication successfully started không đủ nếu sau đó có listen error. |
| .env không có tác dụng | Backend không nạp .env; đặt $env: trong Terminal 1, restart. |
| 403 DEMO_IDENTITY_DISABLED | Development cần đúng development/true trong server process; production phải tiếp tục fail closed. |
| 401 IDENTITY_REQUIRED | Thiếu/sai X-Demo-Actor-Id; chỉ ba ID allowlist. |
| 403 CLAIM_CREATION_FORBIDDEN/TRANSITION_FORBIDDEN | Chọn đúng role; adjuster không tạo claim, claimant không approve/payment/close. |
| 404 CLAIM_NOT_FOUND | Kiểm tra UUID, DB, owner; claim khác owner cố ý bị ẩn. |
| 400 INVALID_REQUEST | JSON, Content-Type, trường/độ dài/query đúng schema; JSON hỏng có thể bị framework từ chối trước handler. |
| 409 REVISION_CONFLICT/STATE_CONFLICT | Đọc lại claim/discovery; không tự sửa revision của command có outcome chưa chắc chắn. |
| 409 COMMAND_ID_REUSED | Retry giữ nguyên ID/actor/payload, không dùng ID cũ cho request khác. |
| 422 CYCLE_LIMIT_REACHED | Hết ba lần request information trong đời claim; không reset counter. |
| DATABASE_INITIALIZATION_FAILED | Path không rỗng, file không phải directory, parent/WAL ghi được. Không dùng Program Files/thư mục chỉ đọc. Kiểm tra path in ra/Test-Path. |
| MIGRATION_DRIFT | Dừng, kiểm tra đúng DB/source, đối chiếu ID/checksum. Khôi phục migration gốc từ Git đáng tin cậy; không tìm được thì báo lỗi. Không sửa checksum/ledger, reset DB hoặc sửa applied migrations. |
| MIGRATION_FAILED | Kiểm tra quyền/khóa/bộ migration; pending transaction rollback. Không sửa applied migration để vượt lỗi. |
| WORKFLOW_VERSION_CONFLICT | Version đã đăng ký có nội dung khác; khôi phục đúng hoặc phát hành version mới, giữ pin claim cũ. |
| Workflow configuration invalid | Giữ config/claims.v2.json và workflow.schema.json đúng chỗ, đọc được/hợp lệ. Không bỏ validator. |
| STORAGE_BUSY/SQLITE_BUSY | Chờ writer; transition retry cùng command. Không xóa WAL/SHM/DB. |
| Observe worker warning | Source còn credentials placeholder; đối chiếu HTTP/lỗi ứng dụng. Telemetry warning riêng chưa chứng minh API hỏng. |
| dist/main không tìm thấy | Dừng watch, build trước start:prod, giữ config/ cạnh dist/. |

## 11. Dừng server

Terminal 1 nhấn **Ctrl+C**, chờ prompt. Nếu hỏi Terminate batch job (Y/N), chọn Y.
Có Nest shutdown hooks/đóng SQLite khi module bị hủy; không Stop-Process theo tên
node hàng loạt. Giữ nguyên database/sidecars. Dùng lại path để giữ dữ liệu; muốn
demo mới thì tạo thư mục mới, không xóa/reset dữ liệu.

## 12. Phạm vi xác minh của lần cập nhật Windows trước

Máy sửa tài liệu là macOS, **không có Windows hoặc PowerShell**. Chưa thực thi hoặc
parse bằng PowerShell, chưa xác minh cài native dependencies trong Windows clean
session. Không tuyên bố Windows đã pass. Các lệnh được đối chiếu scripts/source;
Node 22.15.1/npm 10.9.2 có sẵn dùng cho kiểm tra backend macOS, không chứng minh npm
ci bằng Node 22.22.3 trên Windows thành công. Không clone/cài lại dependencies,
chạy deploy hoặc ghi database hiện có chỉ để kiểm tra tài liệu.

Xem [workflow vocabulary](config/README.md) và [năm kịch bản](../docs/demo-scenarios.md).
Shell/curl trong guide kịch bản vẫn dành cho Unix, không copy thẳng vào PowerShell.
Hướng dẫn này kiểm tra list/create/detail/discovery/audit; không tuyên bố đã chạy
năm kịch bản bằng Windows. Backend/API không cần frontend để kiểm tra setup.

Kết quả của lần cập nhật Windows trước trên macOS: npm test (217 passed), npm run
test:e2e (113 passed), lint, build và TypeScript noEmit đều thành công. Đã chạy
script start:prod với NODE_ENV=development trên cổng chọn động/database tạm mới:
GET /, list/detail/discovery/audit trả 200, create trả 201, thiếu identity trả 401;
SQLite quick_check=ok và đủ 5 migrations. Đây là kiểm tra API/compiled startup
macOS, không thay thế chạy npm.cmd ci/start:dev trong Windows PowerShell.

<a id="macos-va-linux"></a>

## macOS và Linux — Terminal zsh/bash

Các lệnh dưới đây dùng chung cho **macOS Terminal (zsh/bash)** và **Linux bash**.
Không chạy chúng trong PowerShell. Không cần sửa npm scripts hoặc application code.
Phần này chỉ setup/kiểm tra API; các [năm kịch bản](../docs/demo-scenarios.md) đã có
lệnh Unix đúng nên không chép lại ở đây.

### 1. Điều kiện riêng từng hệ điều hành

- Cả hai: chọn **Node.js 22.22.3 hoặc bản 22.x mới hơn**, npm đi kèm, Git, curl.
  Engine toolchain trong lockfile yêu cầu mức này; dự án không pin bản npm riêng.
  Không dùng Node 16/18 hoặc copy node_modules từ OS/runtime khác.
- macOS: nếu better-sqlite3 phải compile thay vì tải prebuilt binary, cần Python và
  Apple Command Line Tools (C/C++). Dùng runtime đúng kiến trúc máy, nhất quán từ
  cài dependency đến chạy server; không trộn native module Intel/Apple Silicon.
- Linux: nếu native build cần thiết, cài Python, C/C++ compiler và make theo hướng
  dẫn distro của bạn. Không có một lệnh apt/yum/apk phổ quát cho mọi distro. Binary
  khả dụng còn tùy kiến trúc/libc; lần sửa này chưa xác minh trên Linux.
- Chọn thư mục local ghi được cho SQLite/WAL/SHM. Không cần SQLite server hoặc CLI.
  Không dùng sudo npm ci để né lỗi quyền.

Terminal 1, từ thư mục bất kỳ:

```sh
node --version
npm --version
git --version
curl --version
```

Mong đợi Node v22.22.3+ trong nhánh 22.x và các công cụ chạy được. Nếu thiếu/sai,
cài hoặc chọn runtime thích hợp theo hệ điều hành rồi mở Terminal mới; kiểm tra
`command -v node` và `command -v npm`. Không tiếp tục chỉ vì shell có một Node cũ.

### 2. Clone và cài — Terminal 1

```sh
cd "$HOME"
git clone https://github.com/tranngochung13/claims-workflow-orchestrator.git &&
  cd claims-workflow-orchestrator/backend &&
  npm ci
```

Mong đợi clone/install exit 0, thư mục hiện tại là backend. Nếu clone/install lỗi,
dừng và xử lý trước startup. Checkout đã tồn tại: không clone đè/xóa, vào backend
của nó rồi npm ci. Lệnh cài dùng đúng lockfile, thay node_modules nhưng không tạo DB.
URL lấy từ Git remote; quyền truy cập repository cần xác minh trên máy sử dụng.

### 3. Chọn database — Terminal 1, tại backend

Chỉ chọn **A hoặc B**. Backend không tự nạp .env; các export phải ở Terminal chạy
server. Tệp .env không tự thay thế những lệnh này. Không commit secrets/local env.

**A. Demo/cài mới, đường dẫn mới hoàn toàn:**

```sh
export CWO_DEMO_DIR="$(mktemp -d "${TMPDIR:-/tmp}/claims-demo.XXXXXX")"
test -n "$CWO_DEMO_DIR" && test -d "$CWO_DEMO_DIR" || exit 1
export SQLITE_DATABASE_PATH="$CWO_DEMO_DIR/claims.sqlite"
test ! -e "$SQLITE_DATABASE_PATH" || exit 1
printf 'New demo database: %s\n' "$SQLITE_DATABASE_PATH"
```

Mong đợi in path mới chưa có claims.sqlite; backend tạo file ở startup. mktemp chỉ
cho thư mục mới, không ghi đè DB cũ. Giữ path để dùng lại. Temp có thể bị hệ điều
hành dọn; không lưu dữ liệu quan trọng lâu dài ở đây.

**B. Database hiện có** (thay cho A), mặc định của checkout, tại backend:

```sh
export SQLITE_DATABASE_PATH="$(pwd -P)/data/claims.sqlite"
test -f "$SQLITE_DATABASE_PATH" || { printf '%s\n' 'Existing database not found; stop and verify its path.' >&2; exit 1; }
printf 'Existing database: %s\n' "$SQLITE_DATABASE_PATH"
```

Nếu process trước dùng path khác, thay giá trị bằng path tuyệt đối thật của tệp đó.
Không dùng path không tồn tại để “phục hồi”. Startup có thể áp dụng pending migration
và đăng ký workflow mới, không phải chỉ đọc: backup SQLite nhất quán trước nâng cấp
dữ liệu quan trọng. Không copy riêng file chính khi writer/WAL còn hoạt động.

Không override thì mặc định backend/data/claims.sqlite, theo module source/dist;
path tương đối theo working directory. Test mode không override dùng :memory:.
Path rỗng bị từ chối, parent được tạo đệ quy. Startup tự kiểm tra ID/SHA-256 trong
schema_migrations rồi áp dụng pending migrations 001–005 theo transaction. Không
có script migrate/reset/seed. Không sửa applied SQL, checksum hoặc xóa DB khi drift.
Config/registry được validate và claim cũ giữ pin; WAL/foreign keys/FULL bật như
phần Windows. Migration 005 chỉ ghi local payment, không chuyển tiền.

### 4. Kiểm tra cổng và start — Terminal 1, tại backend

Dùng Node để kiểm tra cổng, không phụ thuộc lsof trên macOS hoặc ss/netstat của
một distro Linux cụ thể:

```sh
export PORT=31879
export NODE_ENV=development
export DEMO_IDENTITY_ENABLED=true
node --input-type=module <<'JS'
import net from 'node:net';
const server = net.createServer();
server.once('error', error => {
  console.error('Port check failed:', error.code, '- choose another PORT before starting.');
  process.exitCode = 1;
});
server.listen(Number(process.env.PORT), () => server.close());
JS
```

Mong đợi exit 0, không có lỗi. Nếu khác, không chạy bước tiếp theo; chọn PORT khác
và kiểm tra lại. Đây là preflight, vẫn có thể bị process khác chiếm cổng sau đó.

```sh
printf 'PORT=%s NODE_ENV=%s DEMO_IDENTITY_ENABLED=%s\n' "$PORT" "$NODE_ENV" "$DEMO_IDENTITY_ENABLED"
printf 'SQLITE_DATABASE_PATH=%s\n' "$SQLITE_DATABASE_PATH"
npm run start:dev
```

Mong đợi compile không lỗi, routes đăng ký và listen thành công. Giữ Terminal 1 mở.
Nếu có EADDRINUSE hoặc lỗi startup, **không gửi POST** tới cổng đó; có thể server
khác đang trả lời. Chọn cổng khác, restart và cập nhật URL Terminal 2.

PORT mặc định 3000, code chưa validate riêng; dùng số hợp lệ. Hai biến demo phải
đồng thời chính xác development/true. API_PROXY_TARGET là biến Vite, không backend.
App không giới hạn bind host: dùng URL loopback không đồng nghĩa chỉ listen local.
Chỉ bật demo trong môi trường tin cậy, không public; không đổi production guard.

### 5. Kiểm tra HTTP và API — Terminal 2

Từ thư mục bất kỳ, macOS zsh/bash hoặc Linux bash; đổi URL nếu Terminal 1 đổi PORT:

```sh
export CWO_API_BASE_URL=http://127.0.0.1:31879
curl -i "$CWO_API_BASE_URL/"
curl -i "$CWO_API_BASE_URL/api/claims?limit=10&offset=0" \
  -H 'X-Demo-Actor-Id: claimant-1'
curl -i "$CWO_API_BASE_URL/api/claims?limit=10&offset=0" \
  -H 'X-Demo-Actor-Id: adjuster-1'
```

Mong đợi 200 và văn bản Hello World! ở root, 200 với page items/limit/offset ở hai
lệnh list; database mới items=[]. Không có /health. Claim API cần header: claimant-1
và claimant-2 chỉ xem claim mình sở hữu; adjuster-1 xem mọi claim nhưng không tạo.
Nếu status khác, xem bảng lỗi bên dưới; không tiếp tục ghi khi chưa rõ server/path.

**Tạo claim, chỉ trên database demo mới.** Terminal 2 cần Node để đọc ID từ JSON:

```sh
CWO_CREATE_JSON="$(curl --fail -sS "$CWO_API_BASE_URL/api/claims" \
  -H 'Content-Type: application/json' -H 'X-Demo-Actor-Id: claimant-1' \
  --data '{"title":"Hu hong man hinh","description":"Man hinh hong khi van chuyen."}')" || exit 1
printf '%s\n' "$CWO_CREATE_JSON"
export CWO_CLAIM_ID="$(printf '%s' "$CWO_CREATE_JSON" | node --input-type=module -e '
let text = "";
for await (const chunk of process.stdin) text += chunk;
const claim = JSON.parse(text);
if (typeof claim.id !== "string") throw new Error("No claim ID; stop and inspect response");
console.log(claim.id);
')"
test -n "$CWO_CLAIM_ID" || exit 1
```

POST trả 201 (khối trên giữ body JSON, không in HTTP headers); response có UUID thật,
ownerActorId=claimant-1, workflowId=claims, workflowVersion=2, state=draft, revision=0,
informationRequestCount=0, title/description và UTC timestamps. Title/description
không rỗng, tối đa 120/2000 ký tự, không nhận role/owner/state hay trường thừa.
Không retry tạo tự động nếu outcome chưa rõ; endpoint tạo không có deduplication.
Nếu curl lỗi, dùng request không ghi như GET / để chẩn đoán, không gửi POST lại ngay.

```sh
curl -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID" \
  -H 'X-Demo-Actor-Id: claimant-1'
curl -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID/available-transitions" \
  -H 'X-Demo-Actor-Id: claimant-1'
curl -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID/audit?limit=10&offset=0" \
  -H 'X-Demo-Actor-Id: claimant-1'
```

Mong đợi ba status 200: detail là claim object; discovery có metadata/cycle limit,
transitions với submit eligible; audit có metadata, items=[], limit/offset. Không
có API sửa/xóa audit. Claim khác owner bị 404 giống claim không tồn tại. Detail và
discovery không nhận query; list/audit chỉ nhận limit 1–100, offset không âm.

### 6. SQLite readiness chỉ đọc — Terminal 2, tại backend

Vào backend của checkout (ví dụ cd "$HOME/claims-workflow-orchestrator/backend").
Nhập path được Terminal 1 in ra, không chạy lại mktemp:

```sh
printf 'Paste absolute database path from Terminal 1 (no surrounding quotes): '
IFS= read -r SQLITE_DATABASE_PATH
export SQLITE_DATABASE_PATH
test -f "$SQLITE_DATABASE_PATH" || exit 1
node --input-type=module <<'JS'
import Database from 'better-sqlite3';
const db = new Database(process.env.SQLITE_DATABASE_PATH, { readonly: true, fileMustExist: true });
try {
  db.pragma('query_only = ON');
  console.log('quick_check:', db.pragma('quick_check', { simple: true }));
  console.log('foreign_key_check:', db.pragma('foreign_key_check'));
  console.log('migrations:', db.prepare('SELECT id FROM schema_migrations ORDER BY id').all());
} finally { db.close(); }
JS
```

Mong đợi quick_check: ok, foreign_key_check: [], 001–005 sau startup thành công.
DB cũ chưa nâng cấp có thể chỉ có 001–004; không sửa ledger để ép khớp. Không dùng
DatabaseService để đọc trạng thái vì constructor của nó có thể migrate.

### 7. Tests, build, shutdown — tại backend

Terminal 2, tách override DB khỏi phiên test, không đổi server ở Terminal 1:

```sh
unset SQLITE_DATABASE_PATH
npm test &&
  npm run test:e2e &&
  npm run lint &&
  ./node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false
```

Mong đợi tests passed và exit 0. E2E cần socket local, tests dùng memory/DB tạm.
Nếu lỗi, sửa nguyên nhân; không bỏ test/guard. Dừng watch ở Terminal 1 bằng **Ctrl+C**,
chờ prompt, rồi build tại backend để tránh cùng ghi dist/compiler cache:

```sh
npm run build
```

Mong đợi exit 0, tạo dist. Không xóa DB/WAL/SHM khi dừng. Có shutdown hooks/đóng SQLite;
không kill toàn bộ process Node. Dùng lại path để giữ dữ liệu; demo mới chọn path mới.

Tùy chọn chạy compiled server, Terminal 1 giữ database/PORT đã chọn:

```sh
NODE_ENV=production DEMO_IDENTITY_ENABLED=false npm run start:prod
```

Cần build trước, giữ config/ bên cạnh dist/; GET / trả 200, claim API phải 403
DEMO_IDENTITY_DISABLED. Đây không phải cấu hình production authentication hoàn chỉnh.
Không đổi NODE_ENV sang development để vượt guard. npm start là lựa chọn chạy
không watch; các script khác được liệt kê trong phần Windows ở trên.

### 8. Troubleshooting macOS/Linux

| Lỗi | Cách xử lý |
| --- | --- |
| Command not found/EBADENGINE/module syntax error | Kiểm tra command -v node/npm và phiên bản; chọn Node 22.22.3+ nhánh 22.x, mở Terminal mới, npm ci cùng runtime. |
| Native better-sqlite3/ABI/build fail | Không copy node_modules giữa OS/kiến trúc/Node. Kiểm tra tải binary/proxy; nếu compile cần Python/C++ và toolchain riêng macOS/distro như phần prerequisite. |
| Permission denied khi cài | Dùng checkout do user sở hữu, sửa vị trí/quyền theo chính sách máy; không sudo npm ci hoặc chmod rộng để né lỗi. |
| Missing script | Vào backend chứa package.json, không chạy npm start:dev từ repository root. Lệnh đúng là npm run start:dev. |
| EADDRINUSE | Dừng request ghi, chọn PORT trống và cập nhật URL. Trên macOS có thể dùng lsof -nP -iTCP:31879 -sTCP:LISTEN; Linux có ss -ltnp nếu đã cài. Không giả định công cụ này có trên mọi distro, không kill process lạ. |
| Curl connection refused | Đọc startup log, đúng cổng; log successfully started chưa đủ nếu sau đó có listen error. |
| 401/403 | Đúng allowlisted header và export hai biến demo ở Terminal 1 rồi restart; production phải fail closed. Adjuster không tạo claim. |
| 400/404 | Đúng body JSON/query/UUID/database/owner; không bỏ ownership hoặc validation. |
| DATABASE_INITIALIZATION_FAILED | Path không rỗng, parent và WAL ghi được, file không phải directory; kiểm tra path in ở Terminal 1, không tạo DB thay thế khi tìm sai path. |
| MIGRATION_DRIFT/MIGRATION_FAILED | Dừng, đối chiếu đúng DB/source. Khôi phục bộ applied SQL gốc đáng tin cậy; không sửa checksum/history/reset DB. Pending transaction lỗi được rollback. |
| WORKFLOW_VERSION_CONFLICT/config invalid | Khôi phục đúng version hoặc tạo version mới, giữ config/ đúng vị trí/hợp lệ, không đổi pin claim cũ. |
| STORAGE_BUSY/SQLITE_BUSY | Chờ writer; transition retry cùng command ID/payload, không xóa sidecars/DB. |
| Observe telemetry warning | Kiểm tra HTTP/lỗi ứng dụng; placeholder telemetry không phải bằng chứng API hỏng. |

Các mã transition/revision/cycle khác có cùng ý nghĩa như bảng Windows, không phụ
thuộc shell. Không tự đổi revision hoặc reset lifetime counter để ép transition.

### 9. Trạng thái xác minh theo OS

- **macOS:** có môi trường thực; kết quả chạy trong lần cập nhật này được báo riêng
  ở phần tổng kết bên dưới. Cài mới/clone với Node 22.22.3 chưa được thực thi; runtime
  sẵn có là Node 22.15.1/npm 10.9.2, thấp hơn engine một số tooling.
- **Linux:** đã đối chiếu source, bash syntax và quy trình nhưng chưa thực thi trên
  Linux. Docker daemon local không chạy; chạy bash trên macOS không chứng minh Linux.
- **Windows:** giữ nguyên các commands PowerShell của phần trước; không có Windows/
  PowerShell trong môi trường này nên chưa thực thi, không tuyên bố Windows pass.

Kết quả macOS của lần bổ sung Unix này: các khối tạo DB mới, preflight cổng và
start:dev trích từ tài liệu đã chạy bằng bash; các khối API và SQLite readiness
đã chạy bằng zsh. Root, list claimant/adjuster, detail/discovery/audit đều trả 200;
create trả claim ID thật; quick_check=ok, foreign_key_check=[], migrations 001–005.
Đã dừng server test bằng Ctrl+C. npm test: 217 passed; npm run test:e2e: 113 passed;
build, lint, TypeScript noEmit và git diff --check thành công. Mọi khối Unix parse
được bằng bash -n và zsh -n; đây không phải kiểm chứng execution trên Linux.
Không chạy npm ci/clone lại; dùng dependencies sẵn có với Node 22.15.1/npm 10.9.2.

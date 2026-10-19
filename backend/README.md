# Cài đặt và chạy backend Claims Workflow Orchestrator

Backend sử dụng NestJS, TypeScript, SQLite (`better-sqlite3`) và cấu hình workflow
JSON. Hướng dẫn dưới đây dành cho Terminal dùng zsh/bash trên macOS/Linux.
Bắt đầu từ thư mục gốc repository; không cần cài Nest CLI hoặc SQLite server toàn cục.

## 1. Điều kiện cần

- Dùng Node.js **22.22.3 trở lên trong nhánh 22.x**, kèm npm. Đây là mức đáp ứng
  yêu cầu của các công cụ trong `package-lock.json` hiện tại; không dùng Node 16/18.
  `backend/package.json` chưa khai báo `engines` riêng.
- Có `curl` để kiểm tra HTTP. Các ví dụ phân tích JSON dùng chính Node.js.
- Có quyền đọc/ghi thư mục database và tạo các tệp SQLite WAL/SHM bên cạnh nó.
- Kết nối mạng cho lần cài dependency đầu tiên. `better-sqlite3` là native module;
  nếu không có binary phù hợp, quá trình cài có thể cần Python và bộ công cụ C/C++
  của hệ điều hành. Không cần cài thêm package vào dự án để làm theo hướng dẫn.

Từ thư mục gốc repository:

```sh
cd backend
node --version
npm --version
npm ci
```

Mong đợi: phiên bản Node/npm được in ra; `npm ci` kết thúc với exit code 0 và cài
đúng lockfile. Lệnh này thay thế `node_modules`, không khởi tạo database. Không đổi
runtime Node giữa lúc cài native module và lúc chạy backend.

## 2. Biến môi trường

Ứng dụng đọc trực tiếp `process.env`; không có `dotenv`/`ConfigModule` để tự nạp
`.env`. Chỉ tạo một tệp `.env` sẽ không cấu hình backend. Dùng `export` trong chính
Terminal chạy server; biến ở Terminal khác không tự truyền sang.

| Biến | Ý nghĩa và giá trị local |
| --- | --- |
| `PORT` | Cổng HTTP, mặc định `3000` khi không đặt. Ví dụ dùng `3109`; chọn cổng số hợp lệ, chưa bị chiếm. Code chưa validate biến này. |
| `NODE_ENV` | Phải là chính xác `development` để dùng demo identity. Trong `test`, nếu không chỉ định database, mặc định là `:memory:`. Không có giá trị mặc định do ứng dụng tự gán. |
| `DEMO_IDENTITY_ENABLED` | Phải là chính xác chuỗi `true`, đồng thời `NODE_ENV=development`, mới mở claim API demo. Thiếu/sai giá trị sẽ bị từ chối. |
| `SQLITE_DATABASE_PATH` | Đường dẫn SQLite. Không bắt buộc; mặc định là `backend/data/claims.sqlite`, tính theo vị trí module, cả khi chạy source và `dist`. Giá trị rỗng/toàn khoảng trắng bị từ chối. Nên dùng đường dẫn tuyệt đối. Đường dẫn tương đối phụ thuộc working directory. |

Không cần API key hay thông tin payment provider. Module Observe hiện có credential
placeholder trong source, không có biến môi trường Observe do ứng dụng định nghĩa.
`API_PROXY_TARGET` thuộc Vite frontend, không phải cấu hình backend.

Demo không phải authentication production: biết actor ID là có thể chọn danh tính
đó khi demo bật. Chỉ chạy trong môi trường local tin cậy. `app.listen` không chỉ
định bind host; không coi URL `127.0.0.1` bên dưới là cấu hình giới hạn lắng nghe.
Production luôn từ chối demo identity, kể cả đặt `DEMO_IDENTITY_ENABLED=true`.
Chưa có authentication adapter production.

## 3. Chọn database trước khi chạy

Chỉ chọn **một** phương án trong Terminal A, đang ở `backend/`.

### A. Tạo database demo mới, tách khỏi dữ liệu hiện có

```sh
export CWO_DEMO_DIR="$(mktemp -d "${TMPDIR:-/tmp}/claims-demo.XXXXXX")"
export SQLITE_DATABASE_PATH="$CWO_DEMO_DIR/claims.sqlite"
printf 'Database demo: %s\n' "$SQLITE_DATABASE_PATH"
```

`mktemp` chỉ tạo thư mục mới. SQLite chưa tồn tại; backend sẽ tạo tệp và áp dụng
migrations khi khởi động ở bước 4. Giữ lại đường dẫn đã in để kiểm tra hoặc dùng
lại dữ liệu demo. Chạy lại `mktemp` sẽ chọn một database mới khác, không xóa tệp cũ.

### B. Chạy với database hiện có

Đối với database mặc định của checkout này:

```sh
export SQLITE_DATABASE_PATH="$PWD/data/claims.sqlite"
test -f "$SQLITE_DATABASE_PATH" && printf 'Đã tìm thấy: %s\n' "$SQLITE_DATABASE_PATH"
```

Chỉ tiếp tục nếu kiểm tra thành công. Nếu ứng dụng trước đây dùng đường dẫn khác,
đặt `SQLITE_DATABASE_PATH` thành đường dẫn tuyệt đối của **tệp đó** và kiểm tra lại;
không giả định tệp mặc định là database đang dùng của một process khác.
Một đường dẫn sai nhưng ghi được có thể khiến backend tạo database mới ngoài ý muốn.

Khởi động trên tệp hiện có có thể ghi migrations còn thiếu và đăng ký workflow
version mới. Đây không phải thao tác chỉ đọc. Trước khi nâng cấp dữ liệu quan trọng,
dừng process sử dụng database và tạo bản backup SQLite nhất quán theo quy trình
của bạn; không chỉ sao chép riêng tệp chính khi WAL vẫn đang hoạt động.

### Migrations và workflow versions

`DatabaseService` tự chạy migration trong quá trình khởi động, trước khi HTTP server
sẵn sàng. Không có script `migrate`, `seed` hoặc `reset` riêng trong `package.json`.

- Migrations nằm trong `src/database/migrations.ts`: `001_workflow_versions`,
  `002_claims`, `003_claim_ownership`, `004_workflow_transitions`,
  `005_payment_initiations`.
- Lịch sử nằm ở `schema_migrations`. Runner đối chiếu ID/thứ tự và SHA-256 của SQL
  đã áp dụng; sai lệch dừng startup với `MIGRATION_DRIFT`.
- Các migration còn thiếu được áp dụng trong một transaction. Lỗi sẽ rollback
  phần migration đang chờ, không ghi đè checksum cũ.
- Kết nối bật foreign keys, WAL, `synchronous=FULL`, timeout 5 giây.
- `config/claims.v2.json` và `config/workflow.schema.json` được nạp/validate lúc
  startup. Registry lưu version bất biến; claim cũ giữ nguyên version đã pin.
  Không sửa nội dung version đã đăng ký để thay đổi claim cũ.
- Migration 005 chỉ thêm bảng local payment initiation. Không có chuyển tiền thật.

Không xóa database, sửa ledger/checksum, đổi migration 001–004 hay tắt kiểm tra
drift để làm startup thành công. Không chạy `DatabaseService` chỉ để “xem” database:
constructor của nó có thể áp dụng migrations.

## 4. Khởi động backend — Terminal A

Sau khi chọn database, vẫn ở `backend/`:

```sh
# Trên macOS/Linux có lsof: nếu thấy process LISTEN, chọn cổng khác trước khi chạy.
lsof -nP -iTCP:3109 -sTCP:LISTEN
export PORT=3109
export NODE_ENV=development
export DEMO_IDENTITY_ENABLED=true
npm run start:dev
```

Script thực tế là `nest start --watch`: biên dịch, chạy `src/main.ts`, theo dõi thay
đổi mã nguồn. Không cần chạy `npm run build` trước lệnh này. Mong đợi biên dịch
không lỗi, log Nest đăng ký routes và server bắt đầu lắng nghe. Giữ Terminal này mở;
kiểm tra HTTP bên dưới mới xác nhận server đang phục vụ request.
Nếu có EADDRINUSE, dừng bước kiểm tra HTTP và không gửi POST: một server khác có
thể đang trả lời ở cổng đó. Chọn cổng khác, khởi động lại và cập nhật URL ở Terminal B.

Các lựa chọn khác, cũng chạy từ `backend/`:

```sh
# Chạy không watch; dùng môi trường đã export trong Terminal này
npm start

# Hoặc build rồi chạy output, thay cho hai cách trên
npm run build
NODE_ENV=production DEMO_IDENTITY_ENABLED=false npm run start:prod
```

Không chạy đồng thời các lựa chọn trên cùng một cổng/database để thử setup.
`start:prod` là `node dist/main`; cần build trước. Khi đóng gói, giữ `config/`
bên cạnh `dist/`; Nest build không chép JSON workflow vào `dist`. Production có thể
trả `GET /`, nhưng claim routes trả 403 vì chưa có authentication production.

## 5. Kiểm tra server và database — Terminal B

Mở Terminal mới, vào `backend/` từ thư mục gốc repository:

```sh
cd backend
export CWO_API_BASE_URL=http://127.0.0.1:3109
curl -i "$CWO_API_BASE_URL/"
```

Mong đợi HTTP **200**, body là văn bản `Hello World!` (không phải JSON).
Route này không yêu cầu identity. Không có endpoint `/health` hoặc `/api/health`.
Vì app khởi tạo database và registry trước khi listen, response này cho biết quá
trình startup đã hoàn tất; nó không phải kiểm tra tính toàn vẹn database liên tục.

### Kiểm tra SQLite chỉ đọc (tùy chọn)

Trong Terminal B, đặt biến thành **đúng đường dẫn đã in/chọn ở Terminal A**:

```sh
export SQLITE_DATABASE_PATH='/duong/dan/tuyet/doi/claims.sqlite'
node --input-type=module <<'JS'
import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
const path = process.env.SQLITE_DATABASE_PATH;
if (!path || !existsSync(path)) throw new Error('Cần đường dẫn database đã tồn tại');
const db = new Database(path, { readonly: true, fileMustExist: true });
try {
  db.pragma('query_only = ON');
  console.log('quick_check:', db.pragma('quick_check', { simple: true }));
  console.log('foreign_key_check:', db.pragma('foreign_key_check'));
  console.log('migrations:', db.prepare('SELECT id FROM schema_migrations ORDER BY id').all());
} finally {
  db.close();
}
JS
```

Thay đường dẫn mẫu trước khi chạy. Mong đợi `quick_check: ok`,
`foreign_key_check: []`, danh sách 001–005 sau startup thành công trên code hiện tại.
Lệnh không chạy migration, không in nội dung claim. Database cũ chưa được nâng cấp
có thể chỉ có 001–004; không tự sửa lịch sử để ép danh sách khớp.

## 6. Demo identity và quyền truy cập

Mọi route `/api/claims` đều cần header `X-Demo-Actor-Id` thuộc allowlist backend:

| Actor ID | Role | Quyền |
| --- | --- | --- |
| `claimant-1` | `claimant` | Tạo claim, xem claim của mình, thực hiện transition cho claimant. |
| `claimant-2` | `claimant` | Giống trên, nhưng sở hữu tập claim riêng. |
| `adjuster-1` | `adjuster` | Xem mọi claim; thực hiện transition cho adjuster, không được tạo claim. |

Không truyền `role`, `actorId`, `ownerActorId` hoặc state trong body tạo claim.
Backend tự xác định role và owner. Claim khác owner hoặc không tồn tại cùng trả
404 `CLAIM_NOT_FOUND`. Legacy claim không có owner không hiển thị cho claimant.

## 7. Thử API bằng curl — Terminal B

Các lệnh dưới đây dùng `CWO_API_BASE_URL` ở bước 5, với server demo đang bật.
Chỉ lệnh tạo claim ghi dữ liệu; nên thực hiện trên database demo mới.

### Liệt kê claim của claimant-1

```sh
curl -i "$CWO_API_BASE_URL/api/claims?limit=10&offset=0" \
  -H 'X-Demo-Actor-Id: claimant-1'
```

HTTP **200**, JSON `{ "items": [...], "limit": 10, "offset": 0 }`.
Với database mới, `items` là `[]`. Adjuster dùng cùng lệnh với header
`X-Demo-Actor-Id: adjuster-1` để xem tất cả claim.
Phân trang mặc định limit 50/offset 0; limit hợp lệ 1–100, offset nguyên không âm.

### Tạo claim và lưu ID thật

```sh
CWO_CREATE_JSON="$(curl --fail-with-body -sS "$CWO_API_BASE_URL/api/claims" \
  -H 'Content-Type: application/json' \
  -H 'X-Demo-Actor-Id: claimant-1' \
  --data '{"title":"Hu hong man hinh","description":"Man hinh bi hong khi van chuyen."}')"
printf '%s\n' "$CWO_CREATE_JSON"
export CWO_CLAIM_ID="$(printf '%s' "$CWO_CREATE_JSON" | node --input-type=module -e '
let text = "";
for await (const chunk of process.stdin) text += chunk;
const claim = JSON.parse(text);
if (typeof claim.id !== "string") throw new Error("Không nhận được claim ID; kiểm tra lỗi API");
console.log(claim.id);
')"
printf 'Claim ID: %s\n' "$CWO_CLAIM_ID"
```

HTTP **201**; ví dụ JSON có các trường (ID và thời gian do server sinh):

```json
{
  "id": "<UUID thực tế>",
  "ownerActorId": "claimant-1",
  "workflowId": "claims",
  "workflowVersion": 2,
  "state": "draft",
  "title": "Hu hong man hinh",
  "description": "Man hinh bi hong khi van chuyen.",
  "revision": 0,
  "informationRequestCount": 0,
  "createdAt": "<UTC ISO timestamp>",
  "updatedAt": "<UTC ISO timestamp>"
}
```

Lệnh tạo không in HTTP headers để giữ body là JSON cho bước lấy ID. Nếu gặp lỗi,
dừng và kiểm tra response trước khi dùng ID. Không tự động retry tạo claim vì
endpoint tạo chưa có command deduplication. `title`/`description` phải là chuỗi
không rỗng, tối đa lần lượt 120/2000 ký tự; không chấp nhận trường thừa.
`--fail-with-body` cần curl hỗ trợ option này; kiểm tra `curl --version` nếu báo lỗi.

### Xem chi tiết, action được phép và audit

```sh
curl -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID" \
  -H 'X-Demo-Actor-Id: claimant-1'

curl -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID/available-transitions" \
  -H 'X-Demo-Actor-Id: claimant-1'

curl -i "$CWO_API_BASE_URL/api/claims/$CWO_CLAIM_ID/audit?limit=10&offset=0" \
  -H 'X-Demo-Actor-Id: claimant-1'
```

Cả ba trả HTTP **200**:

- Detail trả claim object như response tạo ở trên.
- Available transitions trả `claimId`, `workflowId`, `workflowVersion`, `state`,
  `revision`, `informationRequestCount`, `informationRequestLimit`, `transitions`.
  Claim draft mới có action `submit`; mỗi action có `id`, `label`, `from`, `to`,
  `eligible`, `reasonCode`, `inputFields`. Eligibility vẫn được kiểm tra lại khi execute.
- Audit trả `claimId`, `workflowId`, `workflowVersion`, `items`, `limit`, `offset`.
  Claim mới có `items: []`. Event thành công có actor, transition, state trước/sau,
  revision trước/sau và thời gian. Không có endpoint sửa/xóa audit.

Detail và available-transitions không chấp nhận query parameters. Audit chỉ nhận
`limit`/`offset`. Nếu muốn thử chuyển trạng thái, xem
[năm kịch bản đầy đủ](../docs/demo-scenarios.md), gồm command UUID, expectedRevision,
input bắt buộc, replay và lifecycle tới closed. Không tự suy ra revision mới để
resubmit một command đang có kết quả chưa chắc chắn.

## 8. Xử lý lỗi thường gặp

Lỗi nghiệp vụ có dạng `{ "error": { "code": "...", "message": "..." } }`.
Thông báo lỗi startup xuất hiện trong Terminal A.

| Triệu chứng | Kiểm tra và xử lý |
| --- | --- |
| `EADDRINUSE` | Cổng đã bị process khác dùng. Dừng đúng server của bạn hoặc chọn `PORT` khác rồi cập nhật `CWO_API_BASE_URL` và frontend proxy. Không kill process lạ. |
| Curl không kết nối được | Kiểm tra Terminal A đã startup xong, đúng cổng và chưa dừng. `GET /` phải trả 200 trước khi thử claim API. |
| 403 `DEMO_IDENTITY_DISABLED` | Cần đồng thời `NODE_ENV=development` và `DEMO_IDENTITY_ENABLED=true` trong Terminal chạy backend; restart sau khi đổi env. Không bỏ guard; production phải tiếp tục từ chối. |
| 401 `IDENTITY_REQUIRED` | Thiếu/sai header actor. Chỉ dùng ba ID trong bảng allowlist, không gửi role tùy ý. |
| 403 `CLAIM_CREATION_FORBIDDEN` / `TRANSITION_FORBIDDEN` | Dùng actor đúng role. Adjuster không tạo claim; owner claimant không được approve/payment/close. |
| 404 `CLAIM_NOT_FOUND` | Kiểm tra UUID thật, đúng database và đúng owner. Không bỏ ownership check để tìm claim khác. |
| 400 `INVALID_REQUEST` | Kiểm tra JSON, Content-Type, tên trường/độ dài, query pagination. Body tạo chỉ nhận title và description. JSON sai cú pháp có thể bị framework từ chối trước handler. |
| 409 `REVISION_CONFLICT` / `STATE_CONFLICT` | Đọc lại claim/actions và đánh giá hành động. Không tự thay expectedRevision của command cũ. |
| 409 `COMMAND_ID_REUSED` | Một command ID đã dùng cho request/actor khác. Retry cùng command phải giữ nguyên payload và actor. |
| 422 `CYCLE_LIMIT_REACHED` | Đã dùng hết ba lần yêu cầu thông tin trong suốt đời claim; không reset counter. |
| `DATABASE_INITIALIZATION_FAILED` | Kiểm tra SQLITE_DATABASE_PATH không rỗng, thư mục ghi được, path trỏ tới file chứ không phải thư mục; WAL cần quyền ghi cạnh file. Không sửa quyền quá rộng hoặc xóa database. |
| `MIGRATION_DRIFT` | Dừng. Xác minh đúng database, đối chiếu ID/checksum trong schema_migrations với migration của checkout. Khôi phục đúng migration gốc từ lịch sử đáng tin cậy; nếu không tìm được, giữ nguyên dữ liệu và báo lỗi để xử lý. Không sửa checksum hay reset ledger. |
| `MIGRATION_FAILED` | Đọc lỗi, kiểm tra quyền/khóa/database và bộ migration đúng version. Transaction migration đang chờ đã rollback. Không sửa migration đã áp dụng để thử vượt lỗi. |
| `Workflow configuration invalid` | Kiểm tra config/claims.v2.json và config/workflow.schema.json tồn tại, đọc được và hợp lệ; không tắt validator. |
| `WORKFLOW_VERSION_CONFLICT` | Nội dung khác nhưng dùng lại ID/version đã đăng ký. Khôi phục cấu hình đúng hoặc phát hành version mới; giữ pin của claim cũ. |
| `SQLITE_BUSY` / 503 `STORAGE_BUSY` | Một writer khác giữ khóa. Chờ writer hoàn tất; với transition, retry đúng command ID/payload cũ. Không xóa WAL/SHM hay database. |
| Lỗi load native better-sqlite3 / ABI / thiếu binary | Xác nhận Node phù hợp lockfile, cài lại dependency bằng npm ci với cùng runtime. Khi cần build native, cài toolchain hệ điều hành. Không thay lockfile tùy tiện. |
| `EBADENGINE` khi cài | Kiểm tra node --version và yêu cầu engine từ lockfile. Môi trường Node 22.15.1 từng chạy được nhưng thấp hơn yêu cầu một số công cụ; ưu tiên 22.22.3+ trong nhánh 22.x. |
| Không tìm thấy dist/main | Chạy npm run build trước start:prod và giữ config/ ở đúng vị trí. |
| Observe worker báo lỗi telemetry | Scaffold còn credential placeholder. Kiểm tra HTTP và log startup thực tế; cảnh báo telemetry riêng lẻ chưa chứng minh API thất bại. Không tắt kiểm tra ứng dụng để che lỗi. |

## 9. Kiểm tra tự động và các scripts

Từ `backend/`, với dependencies đã cài:

```sh
npm test
npm run test:e2e
npm run build
npm run lint
./node_modules/.bin/tsc -p tsconfig.json --noEmit --incremental false
```

Mong đợi exit code 0. Tests dùng memory/database tạm qua cấu hình test; không đặt
SQLITE_DATABASE_PATH thành database dữ liệu thật để chạy thử công cụ khác.
E2E cần quyền mở socket local. Build tạo `dist` và có thể cập nhật compiler cache.

| Scripts còn lại | Công dụng |
| --- | --- |
| `npm run start:debug` | Nest watch kèm debugger; chỉ dùng local. |
| `npm run test:watch` | Chạy Vitest watch. |
| `npm run test:cov` | Vitest kèm coverage. |
| `npm run test:debug` | Vitest inspector, không chạy file song song. |
| `npm run format` | Prettier **ghi lại** source/tests; không cần để setup. |
| `npm run deploy` | `nest deploy`; không thuộc quy trình chạy local, chưa xác minh cấu hình/quyền triển khai. |

## 10. Dừng server

Trong Terminal A, nhấn **Ctrl+C**, chờ process thoát và prompt xuất hiện. Không chỉ
đóng tab khi cần chắc chắn server đã dừng. Backend bật Nest shutdown hooks;
DatabaseService đóng kết nối khi module bị hủy. Nếu watch còn process con, kiểm
tra process của đúng phiên chạy trước khi thao tác; không kill theo tên hàng loạt.
Giữ nguyên database và các tệp đi kèm. Chạy lại với cùng đường dẫn sẽ giữ dữ liệu;
chọn database mới bằng phương án A nếu cần một demo độc lập.

## 11. Phạm vi xác minh hướng dẫn

Đã đối chiếu scripts, biến môi trường, schema, routes và response với source hiện
tại. Đã chạy start:dev và các ví dụ HTTP/kiểm tra SQLite trên database tạm riêng,
với Node 22.15.1/npm 10.9.2 có sẵn. Node này thấp hơn yêu cầu một số công cụ trong
lockfile; cài mới bằng Node 22.22.3+ cần xác minh trên máy sử dụng. Không chạy lại
npm ci, deploy, coverage/debug, hoặc khởi động production trong lần sửa tài liệu
này. Các lệnh đó được đối chiếu với package.json; không coi là đã thử thực tế.

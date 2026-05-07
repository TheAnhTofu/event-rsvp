# PaymentAsia / PA-SYS — Hosted Payment Integration

**Nguồn:** `Integration_SC_v2.7(Alipay&Wechat&CUP&CreditCard&FPS).pdf` (Payment Integration Guide).  
**Ghi chú:** Tài liệu đánh dấu *INTERNAL USAGE ONLY*; dùng trong repo làm **knowledge base** cho tích hợp Alipay, WeChat Pay, UnionPay (CUP), thẻ, FPS, Octopus và cổng **UserDefine** (generic).

**Mục đích trong dự án:** Tham chiếu khi triển khai hoặc bổ sung provider thanh toán khu vực HK (bên cạnh Stripe trong `docs/PRODUCT-SPEC.md` và backlog Alipay/WeChat).

---

## Mục lục nhanh

1. [Lịch sử phiên bản](#lịch-sử-phiên-bản)
2. [Luồng thanh toán](#luồng-thanh-toán)
3. [Hosted Payment Page (HTTP POST)](#hosted-payment-page-http-post)
4. [Ví dụ request (PHP / HTML)](#ví-dụ-request-php--html)
5. [Data-feed (notify) callback](#data-feed-notify-callback)
6. [API: Payment Query](#api-payment-query)
7. [API: Refund](#api-refund)
8. [API: Refund Query](#api-refund-query)
9. [API: Reconciliation (settlement)](#api-reconciliation-settlement)
10. [Phụ lục: Chữ ký (SHA-512)](#phụ-lục-chữ-ký-sha-512)
11. [Phụ lục: Trạng thái giao dịch](#phụ-lục-trạng-thái-giao-dịch)
12. [Phụ lục: Mã quốc gia ISO](#phụ-lục-mã-quốc-gia-iso-alpha-2)
13. [Phụ lục: USPS — bang Hoa Kỳ](#phụ-lục-usps-bang-hoa-kỳ)
14. [Phụ lục: Canada — tỉnh / lãnh thổ](#phụ-lục-canada)

---

## Lịch sử phiên bản

| Ngày | Phiên bản | Nội dung |
|------|-----------|----------|
| 2018-03-20 | 1.0 | Official launch |
| 2019-04-20 | 2.0 | Add Wechat Pay |
| 2019-06-25 | 2.1 | Add demo response of query API |
| 2019-10-30 | 2.2 | Add CUP online |
| 2020-02-01 | 2.3 | Add requested fields for credit card |
| 2021-06-28 | 2.4 | Add Generic endpoint |
| 2022-05-12 | 2.5 | Add Atome online |
| 2022-08-25 | 2.6 | Add FPS online |
| 2023-03-31 | 2.7 | Delete Atome Online |
| 2023-09-22 | 2.7.1 | Sandbox gateway, signature tool, coding samples |
| 2025-01-15 | 2.7.2 | Refund API, field `lang` |
| 2025-03-13 | 2.7.3 | Reconciliation API |
| 2025-08-28 | 2.7.4 | Octopus Online |

---

## Luồng thanh toán

Tài liệu gốc có mục *Payment Flow* (trang diagram). Thực tế triển khai: merchant POST form tới **Hosted Payment Page** → khách thanh toán trên trang PA → redirect **`return_url`** + server PA gọi **`notify_url`** (data-feed).

---

## Hosted Payment Page (HTTP POST)

**Merchant Token** lấy từ Merchant Platform (điền vào URL).

| Môi trường | URL |
|------------|-----|
| **Live** | `POST https://payment.pa-sys.com/app/page/[Merchant Token]` |
| **Sandbox** | `POST https://payment-sandbox.pa-sys.com/app/page/[Merchant Token]` |
| **Live — Signature tool** | `POST https://payment.pa-sys.com/app/page/signature/[Merchant Token]` |
| **Generic gateway (all-in-one)** | Live: `POST https://payment.pa-sys.com/app/page/generic/[Merchant Token]` — Sandbox: `POST https://payment-sandbox.pa-sys.com/app/page/generic/[Merchant Token]` |

**Generic gateway:** Cho phép user chọn phương thức; dùng `network` = `UserDefine` (thay vì một network cố định).

**Sandbox account:** Liên hệ `technicalsupport@paymentasia.com` kèm tên công ty đăng ký và email liên hệ.

### Tham số POST

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|----------|------|--------|
| `merchant_reference` | Y | string (36) | Duy nhất cho mỗi lần thanh toán |
| `currency` | Y | string (3) | **CreditCard:** HKD, USD. **Kênh khác:** chỉ HKD |
| `amount` | Y | string (24) | VD `10000.00`, `100.00`, `1.00`. **Octopus:** một chữ số thập phân (`10000.0`, …) |
| `sign` | Y | string (128) | SHA-512 — xem [Phụ lục chữ ký](#phụ-lục-chữ-ký-sha-512) |
| `return_url` | Y | string (255) | Redirect khách sau thanh toán |
| `customer_ip` | Y | string (15) | IPv4 |
| `customer_first_name` | Y | string (255) | |
| `customer_last_name` | Y | string (255) | |
| `customer_address` | N | text | **Bắt buộc nếu** `network` = Credit Card |
| `customer_phone` | Y | string (64) | |
| `customer_email` | Y | string (255) | |
| `customer_state` | N | string (2) | Viết tắt 2 ký tự nếu có (HK → `HK`). **Bắt buộc nếu** Credit Card |
| `customer_country` | N | string (2) | ISO ALPHA-2 (HK, TW, US…). **Bắt buộc nếu** Credit Card |
| `customer_postal_code` | N | string (64) | **Bắt buộc nếu** Credit Card |
| `network` | Y | string (64) | `Alipay`, `Wechat`, `CUP`, `CreditCard`, `Fps`, `Octopus` — **đúng chữ hoa/thường như trên**. Hoặc `UserDefine` (generic) |
| `subject` | Y | string (255) | Tên / mô tả đơn |
| `notify_url` | Y | string (255) | URL nhận **data-feed** sau thanh toán |
| `lang` | N | string (5) | `zh-en` (mặc định), `zh-cn`, `zh-tw` |

Khuyến nghị: cung cấp đủ thông tin (kể cả field không bắt buộc) để hỗ trợ chống gian lận.

---

## Ví dụ request (PHP / HTML)

**Ý tưởng:** `ksort` các field (trừ khi đã thêm `sign`), nối `http_build_query($fields) . $secret`, hash **SHA512**, gán `sign`, POST form `utf-8`.

```php
<?php
$secret = '127f7830-b856-4ddf-92b4-a6478e38547b'; // Signature Secret
$fields = array(
  'merchant_reference' => '1234567890',
  'currency' => 'HKD',
  'amount' => '100.00',
  'customer_ip' => '123.123.123.123',
  'customer_first_name' => 'John',
  'customer_last_name' => 'Doe',
  'customer_address' => '1, Bay Street',
  'customer_phone' => '0123123123',
  'customer_email' => 'someone@gmail.com',
  'customer_state' => 'NY',
  'customer_country' => 'US',
  'return_url' => 'https://demo.shop.com/payment/return',
  'notify_url' => 'https://demo.shop.com/payment/notify',
  'network' => 'Alipay',
  'subject' => 'IphoneX'
);
ksort($fields);
$fields['sign'] = hash('SHA512', http_build_query($fields) . $secret);
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
</head>
<body onload="document.forms['payment'].submit();">
<form method="POST" action="https://payment.pa-sys.com/app/page/ae476881-7bfc-4da8-bc7d-8203ad0fb28c" name="payment" accept-charset="utf-8">
<?php foreach ($fields as $_k => $_v) { ?>
<input type="hidden" name="<?=$_k;?>" value="<?=$_v;?>"/>
<?php } ?>
</form>
</body>
</html>
```

*(Sandbox thay host bằng `payment-sandbox.pa-sys.com` và token thật của merchant.)*

---

## Data-feed (notify) callback

Sau khi thanh toán: khách redirect về `return_url`; **đồng thời** PA gửi POST tới merchant (data-feed) — field:

| Field | Kiểu | Mô tả |
|-------|------|--------|
| `merchant_reference` | string (36) | Giống request |
| `request_reference` | string (36) | ID duy nhất do gateway cấp |
| `currency` | string (3) | ISO 4217 (HKD, …) |
| `amount` | string (24) | |
| `status` | string (2) | Xem [Trạng thái](#phụ-lục-trạng-thái-giao-dịch) |
| `sign` | string (128) | SHA-512 |

### Xác thực phía merchant (PHP mẫu trong tài liệu)

1. Lấy POST: `amount`, `currency`, `request_reference`, `merchant_reference`, `status`, `sign`.
2. Bỏ `sign`, `ksort` data còn lại, `hash('SHA512', http_build_query($data) . $secret)` so khớp `sign`.
3. So khớp `amount`, `currency`, `merchant_reference` với đơn đã lưu (dùng so sánh decimal an toàn, ví dụ `bccomp`).
4. `status`: `0` pending deposit, `1` accepted, `2` rejected (xem bảng đầy đủ dưới).

---

## API: Payment Query

**POST** `https://gateway.pa-sys.com/[Merchant Token]/payment/query`

| Field | Bắt buộc | Mô tả |
|-------|----------|--------|
| `merchant_reference` | Y | Cùng giá trị lúc tạo thanh toán |
| `sign` | Y | SHA-512 theo phụ lục |

**Response:** JSON. Nếu giao dịch gốc đã refund, có **nhiều bản ghi**; mỗi bản ghi gồm:

| Field | Mô tả |
|-------|--------|
| `merchant_reference` | |
| `request_reference` | |
| `currency` | |
| `amount` | |
| `status` | |
| `created_time` | INT |
| `completed_time` | INT hoặc null |
| `type` | `Sale` hoặc `Refund` |

**Ví dụ:** không có bản ghi → `[]`. Một bản ghi / nhiều bản ghi — xem JSON mẫu trong PDF (Sale + Refund).

---

## API: Refund

**POST** `https://gateway.pa-sys.com/v1.1/online/[Merchant Token]/transactions/refund`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|----------|------|--------|
| `merchant_reference` | Y | string (128) | Mã đơn gốc |
| `amount` | Y | Number(6,2) | ≤ số tiền gốc và phần còn lại nếu đã refund một phần |
| `sign` | Y | string(128) | SHA-512 |

**Response (success ví dụ):** JSON có `request`, `response` (`code` e.g. `20000`), `payload` gồm `refund_reference`, `refund_amount`, `status` (ví dụ `4` processing), `metadata.reason`, …

**Lưu ý:** Mọi refund trả về trạng thái xử lý — **dùng Refund Query API** để xác nhận.

---

## API: Refund Query

**POST** `https://gateway.pa-sys.com/v1.1/online/[Merchant Token]/transactions/refund-query`

| Field | Bắt buộc | Mô tả |
|-------|----------|--------|
| `refund_reference` | Y | Từ phản hồi refund |
| `sign` | Y | SHA-512 |

**Payload mẫu:** `status`, `refunded_time`, …

---

## API: Reconciliation (settlement)

Chỉ cho giao dịch **đã settle hoàn tất**.

**POST** `https://gateway.pa-sys.com/v1.1/reconciliation/[Merchant Token]/settlement`

| Field | Bắt buộc | Mô tả |
|-------|----------|--------|
| `settlement_date` | Y | Định dạng `20200925` |
| `network` | Y | Ví dụ `WECHAT` |
| `sign` | Y | SHA-512 |

**Response:** `payload.summary` (`date`, `volume`, `total_charge`, `net_amount`) và `payload.transactions[]` (type, provider, references, amounts, charge, net, status, timestamps…).

---

## Phụ lục: Chữ ký (SHA-512)

- **Secret:** lấy từ Merchant Platform (không log / không commit).
- **Cách:** đặt tất cả field tham gia ký (không gồm `sign`) vào mảng → `ksort` → `http_build_query($fields) . $secret` → `hash('SHA512', ...)`.
- **Lưu ý:** `http_build_query` URL-encode giá trị (ví dụ `,` → `%2C`, `@` → `%40`) — phải khớp cách gateway kỳ vọng (theo mẫu PHP trong tài liệu).

Chuỗi pre-sign mẫu (trích):  
`amount=100.00&currency=HKD&...&subject=IphoneX` nối trực tiếp **secret** (không có `&` giữa query và secret).

---

## Phụ lục: Trạng thái giao dịch

| Giá trị | Ý nghĩa |
|---------|---------|
| `0` | **PENDING** — chờ hành động phía khách |
| `1` | **SUCCESS** — gateway chấp nhận |
| `2` | **FAIL** — bị từ chối |
| `4` | **PROCESSING** — đang xử lý |

---

## Phụ lục: Mã quốc gia (ISO ALPHA-2)

| Code | Name | Code | Name |
|------|------|------|------|
| AD | Andorra | AE | United Arab Emirates |
| AF | Afghanistan | AG | Antigua and Barbuda |
| AI | Anguilla | AL | Albania |
| AM | Armenia | AO | Angola |
| AQ | Antarctica | AR | Argentina |
| AS | American Samoa | AT | Austria |
| AU | Australia | AW | Aruba |
| AX | Åland Islands | AZ | Azerbaijan |
| BA | Bosnia and Herzegovina | BB | Barbados |
| BD | Bangladesh | BE | Belgium |
| BF | Burkina Faso | BG | Bulgaria |
| BH | Bahrain | BI | Burundi |
| BJ | Benin | BM | Bermuda |
| BN | Brunei Darussalam | BO | Bolivia, Plurinational State of |
| BQ | Bonaire, Sint Eustatius and Saba | BR | Brazil |
| BS | Bahamas | BT | Bhutan |
| BV | Bouvet Island | BW | Botswana |
| BY | Belarus | BZ | Belize |
| CA | Canada | CC | Cocos (Keeling) Islands |
| CD | Congo, the Democratic Republic of the | CF | Central African Republic |
| CG | Congo | CH | Switzerland |
| CI | Côte d'Ivoire | CK | Cook Islands |
| CL | Chile | CM | Cameroon |
| CN | China | CO | Colombia |
| CR | Costa Rica | CU | Cuba |
| CV | Cabo Verde | CW | Curaçao |
| CX | Christmas Island | CY | Cyprus |
| CZ | Czech Republic | DE | Germany |
| DJ | Djibouti | DK | Denmark |
| DM | Dominica | DO | Dominican Republic |
| DZ | Algeria | EC | Ecuador |
| EE | Estonia | EG | Egypt |
| EH | Western Sahara | ER | Eritrea |
| ES | Spain | ET | Ethiopia |
| FI | Finland | FJ | Fiji |
| FK | Falkland Islands (Malvinas) | FM | Micronesia, Federated States of |
| FO | Faroe Islands | FR | France |
| GA | Gabon | GB | United Kingdom |
| GD | Grenada | GE | Georgia |
| GF | French Guiana | GG | Guernsey |
| GH | Ghana | GI | Gibraltar |
| GL | Greenland | GM | Gambia |
| GN | Guinea | GP | Guadeloupe |
| GQ | Equatorial Guinea | GR | Greece |
| GS | South Georgia and the South Sandwich Islands | GT | Guatemala |
| GU | Guam | GW | Guinea-Bissau |
| GY | Guyana | HK | Hong Kong |
| HM | Heard Island and McDonald Islands | HN | Honduras |
| HR | Croatia | HT | Haiti |
| HU | Hungary | ID | Indonesia |
| IE | Ireland | IL | Israel |
| IM | Isle of Man | IN | India |
| IO | British Indian Ocean Territory | IQ | Iraq |
| IR | Iran, Islamic Republic of | IS | Iceland |
| IT | Italy | JE | Jersey |
| JM | Jamaica | JO | Jordan |
| JP | Japan | KE | Kenya |
| KG | Kyrgyzstan | KH | Cambodia |
| KI | Kiribati | KM | Comoros |
| KN | Saint Kitts and Nevis | KP | Korea, Democratic People's Republic of |
| KR | Korea, Republic of | KW | Kuwait |
| KY | Cayman Islands | KZ | Kazakhstan |
| LA | Lao People's Democratic Republic | LB | Lebanon |
| LC | Saint Lucia | LI | Liechtenstein |
| LK | Sri Lanka | LR | Liberia |
| LS | Lesotho | LT | Lithuania |
| LU | Luxembourg | LV | Latvia |
| LY | Libya | MA | Morocco |
| MC | Monaco | MD | Moldova, Republic of |
| ME | Montenegro | MF | Saint Martin (French part) |
| MG | Madagascar | MH | Marshall Islands |
| MK | Macedonia, the former Yugoslav Republic of | ML | Mali |
| MM | Myanmar | MN | Mongolia |
| MO | Macao | MP | Northern Mariana Islands |
| MQ | Martinique | MR | Mauritania |
| MS | Montserrat | MT | Malta |
| MU | Mauritius | MV | Maldives |
| MW | Malawi | MX | Mexico |
| MY | Malaysia | MZ | Mozambique |
| NA | Namibia | NC | New Caledonia |
| NE | Niger | NF | Norfolk Island |
| NG | Nigeria | NI | Nicaragua |
| NL | Netherlands | NO | Norway |
| NP | Nepal | NR | Nauru |
| NU | Niue | NZ | New Zealand |
| OM | Oman | PA | Panama |
| PE | Peru | PF | French Polynesia |
| PG | Papua New Guinea | PH | Philippines |
| PK | Pakistan | PL | Poland |
| PM | Saint Pierre and Miquelon | PN | Pitcairn |
| PR | Puerto Rico | PS | Palestine, State of |
| PT | Portugal | PW | Palau |
| PY | Paraguay | QA | Qatar |
| RE | Réunion | RO | Romania |
| RS | Serbia | RU | Russian Federation |
| RW | Rwanda | SA | Saudi Arabia |
| SB | Solomon Islands | SC | Seychelles |
| SD | Sudan | SE | Sweden |
| SG | Singapore | SH | Saint Helena, Ascension and Tristan da Cunha |
| SI | Slovenia | SJ | Svalbard and Jan Mayen |
| SK | Slovakia | SL | Sierra Leone |
| SM | San Marino | SN | Senegal |
| SO | Somalia | SR | Suriname |
| SS | South Sudan | ST | Sao Tome and Principe |
| SV | El Salvador | SX | Sint Maarten (Dutch part) |
| SY | Syrian Arab Republic | SZ | Swaziland |
| TC | Turks and Caicos Islands | TD | Chad |
| TF | French Southern Territories | TG | Togo |
| TH | Thailand | TJ | Tajikistan |
| TK | Tokelau | TL | Timor-Leste |
| TM | Turkmenistan | TN | Tunisia |
| TO | Tonga | TR | Turkey |
| TT | Trinidad and Tobago | TV | Tuvalu |
| TW | Taiwan, Province of China | TZ | Tanzania, United Republic of |
| UA | Ukraine | UG | Uganda |
| UM | United States Minor Outlying Islands | US | United States |
| UY | Uruguay | UZ | Uzbekistan |
| VA | Holy See (Vatican City State) | VC | Saint Vincent and the Grenadines |
| VE | Venezuela, Bolivarian Republic of | VG | Virgin Islands, British |
| VI | Virgin Islands, U.S. | VN | Viet Nam |
| VU | Vanuatu | WF | Wallis and Futuna |
| WS | Samoa | YE | Yemen |
| YT | Mayotte | YU | Yugoslavia |
| ZA | South Africa | ZM | Zambia |
| ZW | Zimbabwe | | |

---

## Phụ lục: USPS (bang Hoa Kỳ)

| State | Code |
|-------|------|
| ALABAMA | AL |
| ALASKA | AK |
| AMERICAN SAMOA | AS |
| ARIZONA | AZ |
| ARKANSAS | AR |
| ARMED FORCES AFRICA | AE |
| ARMED FORCES AMERICAS | AA |
| ARMED FORCES CANADA | AE |
| ARMED FORCES EUROPE | AE |
| ARMED FORCES MIDDLE EAST | AE |
| ARMED FORCES PACIFIC | AP |
| CALIFORNIA | CA |
| COLORADO | CO |
| CONNECTICUT | CT |
| DELAWARE | DE |
| DISTRICT OF COLUMBIA | DC |
| FLORIDA | FL |
| GEORGIA | GA |
| GUAM | GU |
| HAWAII | HI |
| IDAHO | ID |
| ILLINOIS | IL |
| INDIANA | IN |
| IOWA | IA |
| KANSAS | KS |
| KENTUCKY | KY |
| LOUISIANA | LA |
| MAINE | ME |
| MARSHALL ISLANDS | MH |
| MARYLAND | MD |
| MASSACHUSETTS | MA |
| MICHIGAN | MI |
| MICRONESIA | FM |
| MINNESOTA | MN |
| MINOR OUTLYING ISLANDS | UM |
| MISSISSIPPI | MS |
| MISSOURI | MO |
| MONTANA | MT |
| NEBRASKA | NE |
| NEVADA | NV |
| NEW HAMPSHIRE | NH |
| NEW JERSEY | NJ |
| NEW MEXICO | NM |
| NEW YORK | NY |
| NORTH CAROLINA | NC |
| NORTH DAKOTA | ND |
| NORTHERN MARIANA ISLANDS | MP |
| OHIO | OH |
| OKLAHOMA | OK |
| OREGON | OR |
| PALAU | PW |
| PENNSYLVANIA | PA |
| PUERTO RICO | PR |
| RHODE ISLAND | RI |
| SOUTH CAROLINA | SC |
| SOUTH DAKOTA | SD |
| TENNESSEE | TN |
| TEXAS | TX |
| UTAH | UT |
| VERMONT | VT |
| VIRGINIA | VA |
| VIRGIN ISLANDS | VI |
| WASHINGTON | WA |
| WEST VIRGINIA | WV |
| WISCONSIN | WI |
| WYOMING | WY |

---

## Phụ lục: Canada

| Province or territory | Abbreviation |
|----------------------|--------------|
| ALBERTA | AB |
| BRITISH COLUMBIA | BC |
| MANITOBA | MB |
| NEW BRUNSWICK | NB |
| NEWFOUNDLAND AND LABRADOR | NL |
| NORTHWEST TERRITORIES | NT |
| NOVA SCOTIA | NS |
| NUNAVUT | NU |
| ONTARIO | ON |
| PRINCE EDWARD ISLAND | PE |
| QUÉBEC | QC |
| SASKATCHEWAN | SK |
| YUKON | YT |

---

## Liên kết nội bộ repo

- Spec thanh toán tổng quát: [`docs/PRODUCT-SPEC.md`](../../docs/PRODUCT-SPEC.md)
- Backlog Alipay/WeChat: [`agent/memory/product-backlog.md`](../memory/product-backlog.md)

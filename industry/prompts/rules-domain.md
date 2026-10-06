
【嵌入式与具身智能领域翻译规则 — 本平台 100% 是嵌入式系统/机器人行业内容，严格遵守】

1. 歧义默认值：以下词在中文有非行业歧义，**一律按嵌入式含义翻译**：
   - kernel = 内核（RTOS/操作系统的内核，不译"果核"）
   - core = 内核/核心（MCU 内核如 Cortex-M4 core；CPU 核心数）
   - flash = 闪存（存储语境）；作为动词译"烧写/烧录"（flash firmware）
   - driver = 驱动（软件驱动，绝不译"司机"）
   - port = 移植（把软件移植到新平台）；作名词指"端口"
   - bus = 总线（CAN bus / SPI bus，不译"公交车"）
   - image = 镜像（系统镜像/固件镜像，不译"图像"；图像才是 image 的图形语境）
   - host = 主机（不译"主持人"）
   - thread = 线程（RTOS 线程）；作为物联网协议名保留英文"Thread"
   - current = 电流（电气语境如 current consumption = 电流消耗，不译"当前"）
   - ground = 地/接地（GND，不译"地面"）
   - package = 封装（芯片封装）；软件语境译"软件包"
   - pin = 引脚（不译"别针"）
   - board = 开发板/板卡（不译"木板"）
   - cell = 电芯（电池语境）／单元
   - monitor = 监视器/监控（不译"班长"）

2. 以下专有名词**一律保留英文原文**，不翻译不加中文括注：
   - 芯片原厂：Espressif / STMicroelectronics（ST）/ NXP / Texas Instruments（TI）/ Renesas / Microchip / Nordic Semiconductor / Infineon / Silicon Labs / Broadcom
   - 芯片族与系列（举例 + 通用规则）：STM32 / ESP32 / nRF52 / i.MX / RK35xx / GD32 / CH32 / PIC / SAM / RA / RX / RZ / BCM27xx / Pico
     **规则**：任何芯片族名、产品代号一律保留英文
   - 芯片型号（举例 + 通用规则）：STM32H743 / ESP32-S3 / ESP32-P4 / RK3588 / nRF52840 / CH32V307 / GD32F450 / Cortex-M55 / Cortex-A76
     **规则**：型号一字不改（包括字母数字后缀如 -S3 / H743 / V307 / A76），绝不"翻译性扩写"（不要把 "RK3588" 译成 "瑞芯微3588"，不要把 "-S3" 译成 "S 第 3 代"）
   - 技术缩写（举例 + 通用规则）：MCU / SoC / NPU / DSP / FPGA / BSP / HAL / GPIO / PWM / I2C / SPI / UART / CAN / USB / DMA / MMU / SRAM / RTC / ADC / DAC / eMMC / RTOS / VLA / SDK / OTA / JTAG / SWD / RISC-V / BLE / LoRa
     **规则**：任何 2-5 字母的全大写缩写（含 RISC-V 这类带连字符的架构名），默认按嵌入式含义保留英文
   - 跑分与评测（举例 + 通用规则）：CoreMark / EEMBC / MLPerf Tiny / Embench / Dhrystone
     **规则**：以 -mark / -bench 结尾或全大写的评测名一律保留英文
   - 开发工具与 IDE：Keil MDK / IAR / STM32CubeMX / PlatformIO / OpenOCD / J-Link / Segger / GCC / LLVM / CMake / VS Code
   - RTOS 与框架：Zephyr / FreeRTOS / RT-Thread / NuttX / Mbed OS / LiteOS / ROS / ROS 2 / ESP-IDF / LVGL
   - 端侧 AI 与机器人栈：TensorFlow Lite Micro / TFLM / ONNX Runtime / NCNN / RKNN / OpenVINO / Isaac / Isaac Lab / LeRobot / openpi / Jetson
   - 通用技术：API / SDK / CLI / IDE / SaaS / CDN / SSO / OAuth / JWT / WebSocket / SSE / gRPC

3. 中国厂商**优先用官方中文品牌名**（首次出现可双标"乐鑫（Espressif）"，后续选一种保持一致）：
   - 乐鑫（Espressif）/ 兆易创新（GigaDevice）/ 瑞芯微（Rockchip）/ 全志（Allwinner）/ 平头哥（T-Head）/ 先楫（HPMicro）/ 沁恒（WCH）/ 思澈（SiFli）/ 匠芯创（ArtInChip）/ 合宙（Luat）/ 嘉楠（Canaan）/ 算能（Sophgo）/ 进迭时空（SpacemiT）/ 博流（BouffaloLab）/ 华大半导体（HDSC）/ 国民技术 / 海思（HiSilicon）/ 宇树（Unitree）/ 智元（AgiBot）/ 优必选（UBTECH）/ 傅利叶（Fourier）/ 银河通用（Galbot）/ 星动纪元（Robot Era）/ 逐际动力（LimX Dynamics）/ 加速进化（Booster）/ 松延动力（Noetix）

4. 代码 / 命令 / URL / 数字单位 **一字不改**保留：
   - 反引号代码 `code` 不翻译
   - 命令如 west build、idf.py flash、make、git pull 不译（不要译"烧写固件"）
   - URL 原样
   - 数字+单位：480MHz / 1MB Flash / 7nm / 3.5x speedup / $2.90 / 250 TOPS / 99.9%
   - 金额、主频、容量、算力、比例、区间必须保留原文的阿拉伯数字和单位；不要把 $10B-$100B 改写成“数百亿至数千亿美元”等中文数量词

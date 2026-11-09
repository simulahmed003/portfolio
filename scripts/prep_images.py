# One-off: copy and compress source images from the staged D:\08_Portfolio into public/img
import os, sys
from PIL import Image, ImageOps
SRC = sys.argv[1]; OUT = sys.argv[2]
P='01_Projects_in_CV/'; N='02_Projects_Not_Yet_in_CV/'; L='03_Experience_and_Activities/LinkedIn_Posts/images/'
M = {
 'profile/simul': '00_About_Me/Profile_Photos/simul.jpg',
 # ATS
 'ats/render': 'Project Image/WhatsApp Image 2026-05-15 at 11.28.00 AM.jpeg',
 'ats/pcb': 'Project Image/WhatsApp Image 2026-05-15 at 11.28.01 AM.jpeg',
 'ats/unit-1': P+'01_ATS_Power_Control_System/images/automatic transfer switch_01.jpg',
 'ats/unit-2': P+'01_ATS_Power_Control_System/images/automatic transfer switch_02.jpg',
 'ats/unit-3': P+'01_ATS_Power_Control_System/images/automatic transfer switch_03.jpg',
 # BCD
 'bcd/3d': P+'02_BCD_Digital_Clock/images/11.png',
 'bcd/layout': P+'02_BCD_Digital_Clock/images/13.png',
 'bcd/top': P+'02_BCD_Digital_Clock/images/14.png',
 'bcd/sim': P+'02_BCD_Digital_Clock/images/15.png',
 'bcd/schematic': P+'02_BCD_Digital_Clock/images/Photos_of_Real_Hardware__WhatsApp Image 2025-03-28 at 22.32.43_edcfb5fd.jpg',
 # LED cube
 'ledcube/hardware': P+'03_5x5x5_LED_Cube/images/Photos_of_Real_Hardware__5.png',
 'ledcube/panel-3d': P+'03_5x5x5_LED_Cube/images/1.png',
 'ledcube/driver-3d': P+'03_5x5x5_LED_Cube/images/2.png',
 'ledcube/driver-layout': P+'03_5x5x5_LED_Cube/images/3.png',
 'ledcube/panel-layout': P+'03_5x5x5_LED_Cube/images/4.png',
 # IoT water
 'iotwater/v2-3d': P+'04_IoT_Water_Temperature_Controller/images/Photos_of_Real_Hardware__WhatsApp Image 2025-02-03 at 03.25.19_d2e4301d.jpg',
 'iotwater/v2-layout': P+'04_IoT_Water_Temperature_Controller/images/Photos_of_Real_Hardware__WhatsApp Image 2025-02-03 at 03.25.19_45887f9d.jpg',
 'iotwater/v1-3d': P+'04_IoT_Water_Temperature_Controller/images/Photos_of_Real_Hardware__WhatsApp Image 2025-02-03 at 03.25.19_02b8e56e.jpg',
 'iotwater/v1-layout': P+'04_IoT_Water_Temperature_Controller/images/Photos_of_Real_Hardware__WhatsApp Image 2025-02-03 at 03.25.19_d73b8f80.jpg',
 'iotwater/prototype': L+'2024-11-10_27_4.jpg',
 # LFR
 'lfr/v0-track': L+'2023-11-05_33_1.jpg',
 'lfr/v1-top': P+'05_Line_Following_Robot_PCB/images/Photos_of_Real_Hardware_v1__IMG-20250130-WA0002.jpg',
 'lfr/v1-side': P+'05_Line_Following_Robot_PCB/images/Photos_of_Real_Hardware_v1__IMG-20250130-WA0001.jpg',
 'lfr/v1-wheel': P+'05_Line_Following_Robot_PCB/images/Photos_of_Real_Hardware_v1__IMG-20250130-WA0003.jpg',
 'lfr/v1-sensor-1': P+'05_Line_Following_Robot_PCB/images/line following robot_01.jpg',
 'lfr/v1-sensor-2': P+'05_Line_Following_Robot_PCB/images/line following robot_02.jpg',
 'lfr/v2-body': P+'05_Line_Following_Robot_PCB/images/Schematic_and_PCB_Screenshots_v2_Body__2025-05-22 14_41_15-Window.png',
 'lfr/v2-sensor': P+'05_Line_Following_Robot_PCB/images/Schematic_and_PCB_Screenshots_v2_Sensor_Array__2025-05-22 14_38_04-Window.png',
 'lfr/v2-cad': P+'05_Line_Following_Robot_PCB/images/3D_Renders_and_CAD__Part1.JPG',
 'lfr/v3-robot': N+'09_LFR_System_Identification_and_PID/images/Photos_of_Real_Hardware__IMG_20260404_193412186_AE.jpg.jpeg',
 'lfr/v3-block': N+'09_LFR_System_Identification_and_PID/images/Docs_and_Reports_Figures__Diagram LFR-Detail plant.drawio.png',
 'lfr/v3-sysid': N+'09_LFR_System_Identification_and_PID/images/Docs_and_Reports_Figures__system_identification_data_plot.png',
 'lfr/v3-fit': N+'09_LFR_System_Identification_and_PID/images/Docs_and_Reports_Figures__tf_prediction_vs_actual_plot.png',
 'lfr/v3-validation': N+'09_LFR_System_Identification_and_PID/images/Docs_and_Reports_Figures__pid_validation_input_error_dual_axis.png',
 'lfr/v3-calibration': N+'09_LFR_System_Identification_and_PID/images/Docs_and_Reports_Figures__sensor_calibration_plot_improved.png',
 'lfr/v4-vector-top': P+'05_Line_Following_Robot_PCB/images/WhatsApp Image 2026-10-23 at 8.44.30 PM.jpeg',
 'lfr/v4-vector-iso': P+'05_Line_Following_Robot_PCB/images/WhatsApp Image 2026-10-23 at 10.16.43 PM.jpeg',
 # Medicine box / KYRON
 'kyron/v1-enclosure': N+'02_Smart_Medicine_Box_KYRON/images/v1_render__2026-01-16 13_53_59-SOLIDWORKS Premium 2025 SP1.2 - [Assem (1) _].png',
 'kyron/v1-main-3d': N+'02_Smart_Medicine_Box_KYRON/images/v1_pcb__2026-01-16 23_49_19-Medicine Box_MainBoard.PrjPcb - Altium Designer Professional (26.1.1).png',
 'kyron/v1-main-layout': N+'02_Smart_Medicine_Box_KYRON/images/v1_pcb__2026-01-16 23_48_50-Medicine Box_MainBoard.PrjPcb - Altium Designer Professional (26.1.1).png',
 'kyron/v1-ext-3d': N+'02_Smart_Medicine_Box_KYRON/images/v1_pcb__2026-01-16 23_48_08-Medicine Box_Extension.PrjPcb - Altium Designer Professional (26.1.1).png',
 'kyron/v1-ext-layout': N+'02_Smart_Medicine_Box_KYRON/images/v1_pcb__2026-01-16 21_59_29-Medicine Box_Extension.PrjPcb - Altium Designer Professional (26.1.1).png',
 'kyron/v1-cad-1': N+'02_Smart_Medicine_Box_KYRON/images/v1_render__WhatsApp Image 2026-01-07 at 3.19.23 PM.jpeg',
 'kyron/v1-cad-2': N+'02_Smart_Medicine_Box_KYRON/images/v1_render__WhatsApp Image 2026-01-10 at 3.42.41 PM.jpeg',
 'kyron/v1-cad-3': N+'02_Smart_Medicine_Box_KYRON/images/v1_render__WhatsApp Image 2026-01-10 at 8.56.46 PM.jpeg',
 'kyron/concept': N+'02_Smart_Medicine_Box_KYRON/images/WhatsApp Image 2025-12-23 at 1.33.55 AM.jpeg',
 'kyron/v2-board': N+'02_Smart_Medicine_Box_KYRON/images/WhatsApp Image 2026-03-23 at 2.38.49 PM.jpeg',
 'kyron/v2-strip': N+'02_Smart_Medicine_Box_KYRON/images/WhatsApp Image 2026-02-20 at 12.11.46 AM.jpeg',
 # Caretron
 'caretron/launch': L+'2026-04_10_1.jpg',
 'caretron/campaign-1': L+'2026-04_11_1.jpg',
 'caretron/campaign-2': L+'2026-04_12_1.jpg',
 'caretron/print-1': N+'03_Caretron_Kairon_Dispenser/images/enclosure__1_part.png',
 'caretron/print-2': N+'03_Caretron_Kairon_Dispenser/images/enclosure__2_part.png',
 # Cirqoid
 'cirqoid/milling': N+'05_Cirqoid_CNC_Restoration_FabLab/images/1742358663522.jpg',
 'cirqoid/machine': N+'05_Cirqoid_CNC_Restoration_FabLab/images/1742358662933.jpg',
 'cirqoid/result': N+'05_Cirqoid_CNC_Restoration_FabLab/images/1742358662294.jpg',
 'cirqoid/bits': N+'05_Cirqoid_CNC_Restoration_FabLab/images/1742358651437.jpg',
 'cirqoid/precision': L+'2025-07-08_18_1.jpg',
 'cirqoid/ctrl-top': N+'05_Cirqoid_CNC_Restoration_FabLab/images/Photos_of_Real_Hardware__top1.jpg',
 'cirqoid/ctrl-top2': N+'05_Cirqoid_CNC_Restoration_FabLab/images/Photos_of_Real_Hardware__top2.jpg',
 'cirqoid/ctrl-bottom': N+'05_Cirqoid_CNC_Restoration_FabLab/images/Photos_of_Real_Hardware__bottom1.jpg',
 'cirqoid/ctrl-detail': N+'05_Cirqoid_CNC_Restoration_FabLab/images/Photos_of_Real_Hardware__IMG_20260624_142311 (1).jpg',
 # EDGE node
 'edge/stack': N+'13_EDGE_NODE_Multi_Board_PCB/images/EDGE_NODE_stack_assembly_01.png',
 'edge/main-iso': N+'13_EDGE_NODE_Multi_Board_PCB/images/EDGE_NODE_main_board_iso_01.png',
 'edge/main-top': N+'13_EDGE_NODE_Multi_Board_PCB/images/EDGE_NODE_main_board_top_02.png',
 'edge/power': N+'13_EDGE_NODE_Multi_Board_PCB/images/EDGE_NODE_power_board_iso_01.png',
 'edge/interface': N+'13_EDGE_NODE_Multi_Board_PCB/images/EDGE_NODE_interface_board_iso_01.png',
 'edge/carrier': N+'13_EDGE_NODE_Multi_Board_PCB/images/EDGE_NODE_sbc_carrier_top_01.png',
 # SARBS
 'sarbs/logger': N+'07_Thermocouple_Data_Logger_SARBS/images/WhatsApp Image 2026-05-15 at 11.28.01 AM (1).jpeg',
 'sarbs/cnc': '03_Experience_and_Activities/Industrial_Attachments/SARBS_2024-11/WhatsApp Image 2024-11-10 at 21.33.08_f131b5fd.jpg',
 'sarbs/etching': '03_Experience_and_Activities/Industrial_Attachments/SARBS_2024-11/WhatsApp Image 2024-11-10 at 21.33.09_87d268e5.jpg',
 'sarbs/board': L+'2024-11-10_27_3.jpg',
 'sarbs/team': L+'2024-11-10_27_1.jpg',
 # wind
 'wind/logger': N+'10_Wind_Weather_Datalogger_Cup_Anemometer/images/Photos_of_Real_Hardware__datalogger.jpg',
 'wind/setup': N+'10_Wind_Weather_Datalogger_Cup_Anemometer/images/Photos_of_Real_Hardware__data_collection_setup.jpg',
 # activities
 'act/vlsithon-team': L+'2026-09-05_02_1.jpg',
 'act/vlsithon-top10': L+'2026-08-31_03_1.jpg',
 'act/vlsithon-open': L+'2026-08-22_05_1.jpg',
 'act/powerplant': L+'2026-09-05_02_3.jpg',
 'act/easyeda-camp': L+'2026-10_01_1.jpg',
 'act/embedded-innovators': L+'2025-03-23_21_1.jpg',
 'act/altium-training': L+'2025-04-29_19_3.jpg',
 'act/robotics-workshop': L+'2026-01-31_15_1.jpg',
 'act/robotics-workshop-2': L+'2026-01-31_15_3.jpg',
 'act/mars-rover-cert': L+'2026-02-13_14_1.jpg',
 'act/firefly': L+'2023-10-31_35_1.jpg',
 'act/firefly-course': L+'2023-11-02_34_1.jpg',
 'act/robotics-club': L+'2025_24_1.jpg',
 'act/altium-badge': L+'2026-07-19_07_1.jpg',
 'act/resin': P+'06 Resin Printer/1787459188438.jpg',
}
total=0
for k,v in M.items():
    p=os.path.join(SRC,v); o=os.path.join(OUT,k+'.webp')
    os.makedirs(os.path.dirname(o),exist_ok=True)
    im=ImageOps.exif_transpose(Image.open(p)).convert('RGB')
    im.thumbnail((1600,1600))
    im.save(o,'WEBP',quality=80,method=6); total+=os.path.getsize(o)
print(len(M),'images',total//1024,'KB')

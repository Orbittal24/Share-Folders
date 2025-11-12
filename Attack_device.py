import pandas as pd
import serial
import threading
import requests
import time
import logging
import os
import sys
# === Setup Logging ===
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(log_dir, "client_log.txt"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# === Configuration ===
EXCEL_PATH = "config.xlsx"
API_URL = "https://mismainapp.tataautocomp.com:3241/api/v1/send_data"  # Replace with actual FastAPI URL

# Read config from Excel
def read_config():
    try:
        df = pd.read_excel(EXCEL_PATH)
        configs = []
        for _, row in df.iterrows():
            configs.append({
                "line": row["Line"],
                "alt": row["ALT"],
                "body_com_port": row["body_com_port"],
                "coolent_com_port": row["coolent_com_port"]
            })
        logging.info("Configuration file loaded successfully.")
        return configs
    except Exception as e:
        logging.error(f"Error reading configuration file: {e}")
        return []

# Send data to FastAPI server
def send_to_server(data_type, line, alt, value):
    payload = {
        "line": line,
        "alt": alt,
        "type": data_type,
        "value": value
    }
    try:
        response = requests.post(API_URL, json=payload, timeout=5)
        logging.info(f"Sent {data_type} value: {value}, Response: {response.status_code}")
    except Exception as e:
        logging.error(f"Error sending {data_type} data: {e}")

# Read serial data
def read_from_port(port_name, data_type, line, alt):
    try:
        ser = serial.Serial(port=port_name, baudrate=9600, timeout=1)
        logging.info(f"[{data_type}] Listening on {port_name}...")
        while True:
            if ser.in_waiting:
                raw_data = ser.readline().decode("utf-8", errors="ignore").strip()
                if raw_data:
                    logging.info(f"[{data_type}] Data from {port_name}: {raw_data}")
                    send_to_server(data_type, line, alt, raw_data)
            time.sleep(1)
    except serial.SerialException as e:
        logging.error(f"Failed to connect to {port_name}: {e}")
    except Exception as e:
        logging.error(f"Unexpected error on {port_name}: {e}")

# Main execution
if __name__ == "__main__":
    config_list = read_config()

    if not config_list:
        logging.error("No valid configuration found. Exiting...")
        sys.exit()

    for config in config_list:
        threading.Thread(
            target=read_from_port,
            args=(config["body_com_port"], "body_value", config["line"], config["alt"]),
            daemon=True
        ).start()

        threading.Thread(
            target=read_from_port,
            args=(config["coolent_com_port"], "coolent_value", config["line"], config["alt"]),
            daemon=True
        ).start()

    logging.info("Client is running. Press Ctrl+C to exit.")
    try:
        while True:
            time.sleep(2)
    except KeyboardInterrupt:
        logging.info("Exiting client.")

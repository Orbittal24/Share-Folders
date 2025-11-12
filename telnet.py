import pandas as pd
import socket
import threading
import requests
import time
import logging
import os
import sys
from logging.handlers import RotatingFileHandler

# === Setup Logging with Console Output ===
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "tcp_client_log.txt")

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# File Handler
file_handler = RotatingFileHandler(log_file, maxBytes=5 * 1024 * 1024, backupCount=5)
file_formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
file_handler.setFormatter(file_formatter)

# Console Handler
console_handler = logging.StreamHandler(sys.stdout)
console_formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
console_handler.setFormatter(console_formatter)

# Add handlers to logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# === Configuration ===
EXCEL_PATH = "telnet.xlsx"
API_URL = "https://mismainapp.tataautocomp.com:3241/api/v1/send_data"  # Replace with your FastAPI URL
PORT = 23  # Set the TCP/IP port used by the device

# Read config from Excel
def read_config():
    try:
        df = pd.read_excel(EXCEL_PATH)
        configs = []
        for _, row in df.iterrows():
            configs.append({
                "line": row["Line"],
                "alt": row["ALT"],
                "body_ip": row["body_ip"],
                "coolent_ip": row["coolent_ip"]
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

# TCP/IP reading thread
def read_from_ip(ip_address, data_type, line, alt):
    while True:  # Reconnect loop
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.connect((ip_address, PORT))
                logging.info(f"[{data_type}] Connected to {ip_address}:{PORT}...")

                interface_selected = False  # Track if interface selection is done

                while True:
                    data = sock.recv(1024).decode("utf-8", errors="ignore").strip()

                    if data:
                        logging.info(f"[{data_type}] Data from {ip_address}: {data}")

                        # Detect interface selection prompt
                        if not interface_selected and ("TCP/IP INTERFACE SELECTION" in data or "Select from the following available connections" in data):
                            logging.info(f"[{data_type}] Sending interface selection '1' to {ip_address}")
                            sock.sendall(b'1\r\n')  # Send selection for interface 1
                            interface_selected = True
                            continue  # Skip sending this prompt to API

                        # Skip sending menu prompts to the API
                        if "TCP/IP INTERFACE SELECTION" in data or "Select from the following available connections" in data:
                            continue

                        # Skip sending the echoed selection
                        if data == '1':
                            continue

                        # Send actual data to server
                        send_to_server(data_type, line, alt, data)

                    time.sleep(1)
        except Exception as e:
            logging.error(f"Connection error with {ip_address}: {e}")
            logging.info(f"Retrying connection to {ip_address} in 5 seconds...")
            time.sleep(5)

# Main execution
if __name__ == "__main__":
    config_list = read_config()

    if not config_list:
        logging.error("No valid configuration found. Exiting...")
        sys.exit()

    for config in config_list:
        threading.Thread(
            target=read_from_ip,
            args=(config["body_ip"], "body_value", config["line"], config["alt"]),
            daemon=True
        ).start()

        threading.Thread(
            target=read_from_ip,
            args=(config["coolent_ip"], "coolent_value", config["line"], config["alt"]),
            daemon=True
        ).start()

    logging.info("TCP/IP Client is running. Press Ctrl+C to exit.")
    try:
        while True:
            time.sleep(2)
    except KeyboardInterrupt:
        logging.info("Exiting TCP/IP client.")

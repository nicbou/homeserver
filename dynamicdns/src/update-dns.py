from requests.exceptions import HTTPError
from time import sleep
import requests
import logging
import os

logging.basicConfig(**{
    'datefmt': '%Y-%m-%d %H:%M:%S',
    'format': '[%(asctime)s] %(levelname)s [%(name)s.%(funcName)s:%(lineno)d] %(message)s',
    'level': logging.INFO,
})
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

domain = os.environ.get('DOMAIN')
subdomains = [sd.strip() for sd in os.environ.get('SUBDOMAINS', '').split(',')]

headers = {
    'Authorization': f"Bearer {os.environ.get('DIGITALOCEAN_TOKEN', '')}",
    'Content-Type': 'application/json',
}


def update_dns():
    current_ip = requests.get('http://ipinfo.io/ip').text
    all_records_url = f'https://api.digitalocean.com/v2/domains/{domain}/records?per_page=200'
    all_records = requests.get(url=all_records_url, headers=headers).json()
    a_records = [r for r in all_records['domain_records'] if r['type'] == 'A' and r['name'] in subdomains]

    existing_subdomains = set()
    for record in a_records:
        record_url = f"https://api.digitalocean.com/v2/domains/{domain}/records/{record['id']}"

        if record['name'] in existing_subdomains:
            logger.warning(f"{record['name']}.{domain}: Found duplicate A record")
            try:
                r = requests.delete(url=record_url, headers=headers)
                r.raise_for_status()
            except HTTPError:
                logger.exception(f"{record['name']}.{domain}: Could not delete duplicate A record.")
            else:
                logger.info(f"{record['name']}.{domain}: Deleted duplicate A record.")
        elif record['data'] != current_ip:
            logger.warning(f"{record['name']}.{domain}: DNS A record ({record['data']}) does not match current IP ({current_ip})")
            try:
                r = requests.patch(url=record_url, headers=headers, json={
                    'type': 'A',
                    'name': record['name'],
                    'data': current_ip,
                })
                r.raise_for_status()
            except HTTPError:
                logger.exception(f"{record['name']}.{domain}: Could not update A record to current IP ({current_ip})")
            else:
                logger.info(f"{record['name']}.{domain}: Updated A record to current IP ({current_ip})")
        else:
            logger.info(f"{record['name']}.{domain}: DNS A record matches current IP ({current_ip})")

        existing_subdomains.add(record['name'])


while True:
    if os.environ.get('DIGITALOCEAN_TOKEN'):
        try:
            update_dns()
        except:
            logger.exception("Could not update DNS. Trying again later.")
        sleep(30 * 60)
    else:
        logger.error("DIGITALOCEAN_TOKEN environment variable is not set. Exiting.")
        exit()

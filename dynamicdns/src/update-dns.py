from time import sleep
import requests
import logging
import os

logger = logging.getLogger(__name__)

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
            requests.delete(url=record_url, headers=headers)
            logger.info(f"{record['name']}.{domain}: Deleted duplicate A record.")

        elif record['data'] != current_ip:
            logger.warning(f"{record['name']}.{domain}: DNS A record ({record['data']}) does not match current IP ({current_ip})")
            requests.post(url=record_url, headers=headers, data={
                'type': 'A',
                'name': record['name'],
                'data': current_ip,
            })
            logger.info(f"{record['name']}.{domain}: Updated A record to current IP ({current_ip})")

        else:
            logger.info(f"{record['name']}.{domain}: DNS A record matches current IP ({current_ip})")

        existing_subdomains.add(record['name'])


while True:
    if os.environ.get('DIGITALOCEAN_TOKEN'):
        update_dns()
    sleep(30 * 60)

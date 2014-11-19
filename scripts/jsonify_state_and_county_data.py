#from pymongo import Connection
import csv
import datetime
import json
from collections import defaultdict

state_abbr = {'alabama': 'AL',
'alaska':'AK',
'american samoa':'AS',
'arizona':'AZ',
'arkansas':'AR',
'california':'CA',
'colorado':'CO',
'connecticut':'CT',
'delaware':'DE',
'districtofcolumbia':'DC',
'district of columbia':'DC',
'florida':'FL',
'georgia':'GA',
'guam':'GU',
'hawaii':'HI',
'idaho':'ID',
'illinois':'IL',
'indiana':'IN',
'iowa':'IA',
'kansas':'KS',
'kentucky':'KY',
'louisiana':'LA',
'maine':'ME',
'maryland':'MD',
'massachusetts':'MA',
'michigan':'MI',
'minnesota':'MN',
'mississippi':'MS',
'missouri':'MO',
'montana':'MT',
'us':'NA',
'nebraska':'NE',
'nevada':'NV',
'new hampshire':'NH',
'new jersey':'NJ',
'new mexico':'NM',
'new york':'NY',
'north carolina':'NC',
'north dakota':'ND',
'northern mariana islands':'MP',
'ohio':'OH',
'oklahoma':'OK',
'oregon':'OR',
'pennsylvania':'PA',
'puerto rico':'PR',
'rhode island':'RI',
'south carolina':'SC',
'south dakota':'SD',
'tennessee':'TN',
'texas':'TX',
'utah':'UT',
'vermont':'VT',
'virgin islands':'VI',
'virginia':'VA',
'washington':'WA',
'west virginia':'WV',
'wisconsin':'WI',
'wyoming':'WY'}

county_data = {}
state_data = {}
summary = defaultdict(dict)

#connection = Connection()
#connection.database_names
#db = connection['mapping_wealth']
sniffer = csv.Sniffer()
d = sniffer.sniff(open('data/complete_data.tsv').read())
r = csv.reader(open('data/complete_data.tsv'),d)
#county_data = db.county_data
#state_data = db.state_data

#fields = 'year state_id county_id state_county_id state_name county_name return_num population sum_agi avg_agi sum_wage avg_wage sum_div avg_div sum_int avg_int conversion_rate'.split()
fields = [  'year',
            'state_id',
            'county_id',
            'state_county_id',
            'state_name',
            'county_name',
            'return_num',
            'exemption_num',
            'sum_agi',
            'avg_agi',
            'sum_wage',
            'avg_wage',
            'sum_div',
            'avg_div',
            'sum_int',
            'avg_int',
            'conversion_rate']

for row in r:
    year = int(row[0])
    state_id,county_id,state_county_id,state_name = row[1:5]
    sum_agi,sum_wage,sum_div,sum_int = [int(float(a)) for a in [row[8],row[10],row[12],row[14]]]
    avg_agi,avg_wage,avg_div,avg_int = [float(a) for a in [row[9],row[11],row[13],row[15]]]
    return_num,exemption_num = [int(a) for a in [row[6],row[7]]]
    conversion_rate = float(row[-1])
    if county_id not in ['000','999']:
        county_name = row[5]
        if state_county_id not in county_data:
            county_data[state_county_id] = { 
                    'state'     : state_abbr[state_name.lower()],
                    'state_id'  : state_id,
                    'name'      : county_name,
                    'data'      : defaultdict(dict)}
        county_data[state_county_id]['data'][year] = { 
                    'avg_agi'   :   avg_agi,
                    'avg_wage'  :   avg_wage,
                    'avg_div'   :   avg_div,
                    'avg_int'   :   avg_int,
                    'ret_num'   :   return_num,
                    'exm_num'   :   exemption_num}
    else:
        if county_id == '000':
            if state_id not in state_data:
                state_data[state_id] = {
                    'abbr'     : state_abbr[state_name.lower()],
                    'state_id'  : state_id,
                    'name'      : state_name,
                    'data'      : defaultdict(dict)}
            state_data[state_id]['data'][year] = {
                        'avg_agi'   :   avg_agi,
                        'avg_wage'  :   avg_wage,
                        'avg_div'   :   avg_div,
                        'avg_int'   :   avg_int,
                        'ret_num'   :   return_num,
                        'exm_num'   :   exemption_num}
        else:
            summary[year] = {
                        'avg_agi'   :   avg_agi,
                        'avg_wage'  :   avg_wage,
                        'avg_div'   :   avg_div,
                        'avg_int'   :   avg_int,
                        'ret_num'   :   return_num,
                        'exm_num'   :   exemption_num,
                        'conversion':   conversion_rate} 


json.dump(county_data,open('county_data.json','w'),indent=2)
json.dump(state_data,open('state_data.json','w'),indent=2)
json.dump(summary,open('summary_data.json','w'),indent=2)

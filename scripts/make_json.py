d = {}
import csv
import json
import os
import sys

def convert_currency(string):
    if string:
        return int(string.replace('$','').replace(',',''))
    else:
        return None

class DataCollection():
    def __init__(self,data_dir,min_year=2004,max_year=2009):
        self.headers = []
        self.min_year = min_year
        self.max_year = max_year
        self.data_dir = data_dir
        self.init_data()
        self.populate_data()
    def export_csv(self):
        out = open(os.path.join(self.data_dir,'all_years.csv'),'w')
        out.write('\t'.join(['county_id','year','avg_agi','avg_wage','avg_div','avg_int']))
        out.write('\n')
        for cid,county in self.data_coll.items():
            for year,d in county['data'].items():
                out_vals = [cid,
                            year,
                            d['avg_agi'],
                            d['avg_wage'],
                            d['avg_div'],
                            d['avg_int']]
                out.write('\t'.join([str(a) for a in out_vals]))
                out.write('\n')
    def export_json(self):
        jdict = {}
        jdict['summary'] = self.summary
        jdict['counties'] = self.data_coll
        #for county in self.data_coll.values():
        #    jdict['counties'].append(county)
        json.dump(jdict['counties'],
                    open(os.path.join(self.data_dir,'all_years.json'),'w'))
                    #indent=2)
        json.dump(jdict['summary'],
                    open(os.path.join(self.data_dir,'all_years_summary.json'),'w'))
    def init_data(self):
        self.data_coll = {}
        self.summary = { 'min_year'     : self.min_year,
                                 'max_year'     : self.max_year,
                                 'min_avg_agi'  : 99999,
                                 'max_avg_agi'  : 0,
                                 'min_avg_wage' : 99999,
                                 'max_avg_wage' : 0,
                                 'min_avg_div'  : 99999,
                                 'max_avg_div'  : 0,
                                 'min_avg_int'  : 99999,
                                 'max_avg_int'  : 0}
        r = csv.reader(open('data/%d.csv'%(self.min_year)))
        headers = r.next()
        for row in r:
            c_id,c_name,geom,s_abbr,return_num,avg_agi,avg_wage,avg_div,avg_int = row
            self.data_coll[c_id] = { #'id'       : c_id,
                                     'name'     : c_name,
                                     'state'    : s_abbr,
                                     'data'     : {}}
    def populate_data(self):
        for year in range(self.min_year,self.max_year+1):
            csv_filename = 'data/%d.csv'%(year,)
            d = csv.Sniffer().sniff(open(csv_filename).read())
            r = csv.reader(open(csv_filename),d)
            headers = r.next()
            for row in r:
                c_id,c_name,geom,s_abbr,return_num,avg_agi,avg_wage,avg_div,avg_int = row
                if avg_agi != '':
                    avg_agi  = convert_currency(avg_agi)
                    self.summary['min_avg_agi'] =  min(
                            avg_agi, self.summary['min_avg_agi'])
                    self.summary['max_avg_agi'] =  max(
                            avg_agi, self.summary['max_avg_agi'])
                else:
                    avg_agi = None
                if avg_wage != '':
                    avg_wage  = convert_currency(avg_wage)
                    self.summary['min_avg_wage'] =  min(
                            avg_wage, self.summary['min_avg_wage'])
                    self.summary['max_avg_wage'] =  max(
                            avg_wage, self.summary['max_avg_wage'])
                else:
                    avg_wage = None
                if avg_div != '':
                    avg_div  = convert_currency(avg_div)
                    self.summary['min_avg_div'] =  min(
                            avg_div, self.summary['min_avg_div'])
                    self.summary['max_avg_div'] =  max(
                            avg_div, self.summary['max_avg_div'])
                else:
                    avg_div = None
                if avg_int != '':
                    avg_int  = convert_currency(avg_int)
                    self.summary['min_avg_int'] =  min(
                            avg_int, self.summary['min_avg_int'])
                    self.summary['max_avg_int'] =  max(
                            avg_int, self.summary['max_avg_int'])
                else:
                    avg_int = None
                self.data_coll[c_id]['data'][year] = {'avg_agi'  : avg_agi,
                                                      'avg_wage' : avg_wage,
                                                      'avg_div'  : avg_div,
                                                      'avg_int'  : avg_int }

if __name__ == '__main__':
    try:
        data_dir = os.path.abspath(sys.argv[1])
    except IndexError:
        raise RuntimeError('ERROR: please specify at least a data directory')
    try:
        min_year = sys.argv[2]
        max_year = sys.argv[3]
        dc = DataCollection(data_dir,min_year,max_year)
    except IndexError:
        dc = DataCollection(data_dir)
        sys.stderr.write("using default time span: %d - %d\n"%(
                                        dc.min_year,dc.max_year))
    dc.export_json()
    dc.export_csv()

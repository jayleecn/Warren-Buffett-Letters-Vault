"""Validate the generated multilingual site without changing it (stdlib only)."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote, urljoin
import json, sys, xml.etree.ElementTree as ET, gzip

root=Path(sys.argv[1] if len(sys.argv)>1 else 'public')
base='https://buffett-letters.com/'
class Page(HTMLParser):
 def __init__(self, text):
  super().__init__();self.links=[];self.canonical=[];self.alternates={};self.robots='';self.lang='';self.article=False;self.article_links=[];self.feed(text)
 def handle_starttag(self,tag,items):
  a=dict(items)
  if tag=='html':self.lang=a.get('lang','')
  if tag=='article':self.article=True
  if tag=='a' and a.get('href'):
   self.links.append(a['href'])
   if self.article:self.article_links.append(a['href'])
  if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href'))
  if tag=='link' and a.get('rel')=='alternate' and a.get('hreflang'):self.alternates[a['hreflang']]=a['href']
  if tag=='meta' and a.get('name')=='robots':self.robots=a.get('content','')
 def handle_endtag(self,tag):
  if tag=='article':self.article=False

def output_file(url):
 path=unquote(urlsplit(url).path).lstrip('/')
 p=root/path
 for q in [p,p.with_suffix(p.suffix+'.html'),p/'index.html']:
  if q.is_file():return q
 return None

index=json.loads((root/'static/contentIndex.json').read_text())
errors=[];article_count=0;all_broken=[]
for slug in index:
 fp=root/(slug+'.html');page=Page(fp.read_text());url=base+slug
 if len(page.canonical)!=1:errors.append([slug,'canonical count',page.canonical]);continue
 canonical=page.canonical[0]
 if output_file(canonical)!=fp:errors.append([slug,'canonical target',canonical])
 if len(page.alternates)!=7:errors.append([slug,'hreflang count',page.alternates])
 for lang,alt in page.alternates.items():
  if not output_file(alt):errors.append([slug,'missing alternate',alt])
 for href in page.article_links:
  dest=urljoin(url,href);u=urlsplit(dest)
  if u.netloc=='buffett-letters.com' and not output_file(dest):all_broken.append([slug,href])
 article_count+=len(page.article_links)
 if not page.lang:errors.append([slug,'missing lang'])
 if 'noindex' in page.robots:errors.append([slug,'content noindex'])
errors.extend(all_broken)
sitemap=ET.parse(root/'sitemap.xml');ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls=sitemap.findall('s:url',ns)
for entry in urls:
 loc=entry.findtext('s:loc',namespaces=ns)
 if not output_file(loc):errors.append(['sitemap missing',loc])
 date=entry.findtext('s:lastmod',namespaces=ns)
 if date and not ('2020'<=date[:4]<='2026'):errors.append(['sitemap date',loc,date])
if len(urls)!=len(index):errors.append(['sitemap count',len(urls),len(index)])
notfound=Page((root/'404.html').read_text())
if 'noindex' not in notfound.robots:errors.append(['404 indexable'])
meta=(root/'static/contentIndex-meta.json').read_bytes();full=(root/'static/contentIndex.json').read_bytes()
search={p.stem:len(json.loads(p.read_text())) for p in (root/'static/search-index').glob('*.json')}
if len(search)!=6 or sum(search.values())!=len(index):errors.append(['search count',search])
result={'pages':len(index),'sitemap_urls':len(urls),'article_links':article_count,'broken_article_links':len(all_broken),'errors':errors[:50], 'error_count':len(errors),'initial_index_bytes':len(meta),'previous_index_bytes':len(full),'initial_index_gzip':len(gzip.compress(meta)),'previous_index_gzip':len(gzip.compress(full)),'search_pages_by_language':search}
print(json.dumps(result,ensure_ascii=False,indent=2))
sys.exit(bool(errors))

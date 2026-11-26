#!/bin/sh
# platform.sql'i yerel Postgres 16'da (Supabase auth şeması taklit edilir) eski kurulum + junior eklentisiyle birlikte dener.
# Kullanım: PGHOST=/var/tmp/sra-pg PGPORT=5434 sh test/db/calistir.sh
set -e
K="$(cd "$(dirname "$0")/../.." && pwd)"
P="psql -U postgres -q -v ON_ERROR_STOP=1"
$P -c "drop database if exists platform_test" -c "create database platform_test"
for f in test/db/supabase_taklit.sql kurslar/ortaokul/site/supabase/kurulum.sql kurslar/junior/supabase/junior.sql supabase/platform.sql supabase/platform.sql supabase/lab.sql supabase/lab.sql supabase/analitik.sql supabase/analitik.sql supabase/dersler.sql supabase/dersler.sql supabase/ders-onay.sql supabase/ders-onay.sql; do
  $P -d platform_test -f "$K/$f" 2>&1 | grep -v NOTICE || true
done
$P -d platform_test -f "$K/test/db/senaryo.sql" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: //'
$P -d platform_test -f "$K/test/db/lab.sql" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: //'
$P -d platform_test -f "$K/test/db/analitik.sql" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: //'
$P -d platform_test -f "$K/test/db/ders-onay.sql" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: //'
(cd "$K" && $P -d platform_test -f test/db/ornek.sql 2>&1 | sed 's/^psql:[^:]*:[0-9]*: //')

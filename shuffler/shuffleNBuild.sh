cd ../pokeemerald
git reset --hard
cd ../shuffler
python3 shuffler.py seed.json
cd ../agbcc
git clean -fX
./build.sh
./install.sh ../pokeemerald
cd ../pokeemerald
make
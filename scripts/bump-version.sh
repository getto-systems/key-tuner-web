bump_build

for target in $(find . -name Cargo.toml); do
  bump_sync $target 's/^version = "[0-9.-]\+"/version = "'$(cat .release-version)'"/'
done

for target in $(find . -name package.json); do
  bump_sync $target 's/"version": "[0-9.-]\+"/"version": "'$(cat .release-version)'"/'
done

npm install
git add package-lock.json

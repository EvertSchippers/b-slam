rm -r build/*
rm -r site/dist/*
tsc --outDir build
npx webpack -o .\site\dist --entry ./build --mode production
rm -r build/*
tsc --outDir build
npx webpack -o .\site\dist --entry ./build
const readline = require('readline');
const fs = require('fs');

const { difference, intersection } = require('lodash');


const SUBMISSION_NAME = 'c_memorable_moments.txt';
const INPUT_PATH = `${__dirname}/inputs/${SUBMISSION_NAME}`;


const getPhotosInterestFactor = (slideA, slideB) => {
  // return 5;
  const slideATags = slideA.isSingle
    ? slideA.photoA.tags
    : [...new Set([...slideA.photoA.tags, ...slideA.photoB.tags])];

  const slideBTags = slideB.isSingle
    ? slideB.photoA.tags
    : [...new Set([...slideB.photoA.tags, ...slideB.photoB.tags])];



  const commonTagsLength = intersection(slideATags, slideBTags).length;
  if (commonTagsLength === 0) {
    return 0;
  }
  const uniqALength = difference(slideATags, slideBTags).length;
  if (uniqALength === 0) {
    return 0;
  }
  const uniqBLength = difference(slideBTags, slideATags).length;
  if (uniqBLength === 0) {
    return 0;
  }

  // console.warn('compared', {commonTagsLength, uniqALength, uniqBLength });
  // console.warn('compared', { slideATags, slideBTags });
  return Math.min(commonTagsLength, uniqALength, uniqBLength);
}


const getData = (path) => new Promise((resolve) => {
  const rl = readline.createInterface({
    input: fs.createReadStream(path),
    crlfDelay: Infinity
  });

  const photosCollectionHash = {};
  const photosCollection = [];
  let lineIndex = 0;

  rl.on('line', (line) => {
    console.warn('line', line);

    if (lineIndex === 0) {
      lineIndex += 1;
      return;
    }

    const [type, tagsCount, ...tags] = line.split(' ');

    const slide = {
      id: lineIndex - 1,
      type,
      tags: tags.map(item => item.slice(1)),
    };

    photosCollectionHash[slide.id] = slide;

    photosCollection.push(slide);

    lineIndex += 1;
  });

  rl.on('close', () => {
    resolve({ photosCollection, photosCollectionHash });
  });
});

const writeSubmission = (fileName, assignedData) => {
  fs.writeFileSync(`${__dirname}/submissions/${fileName}`, assignedData.join('\n'));
};


const prepareAndWriteSubmission = (slides) => {
  let resultArr = [slides.length];
  for (let slide of slides) {
    resultArr.push(slide.split('-').join(' '));
  }
  writeSubmission(SUBMISSION_NAME, resultArr);
}

const getSortedSlides = (slides, slidesHash) => {
  let result = [];

  for (let i = 0; i < slides.length - 1; i += 1) {
    const slideId = slides[i].join('-');
    const slide = slidesHash[slideId];
    let maximumInterest = 0;
    let maximumSecondSlideId = null;

    console.warn(slideId);

    if (slide.isUsed) {
      continue;
    }


    for (let j = i + 1; j < slides.length; j += 1) {
      const secondSlideId = slides[j].join('-');
      // console.warn('comparing', { slideId, secondSlideId });
      const secondSlide = slidesHash[secondSlideId];

      // was already in pair before
      if (secondSlide.isUsed) {
        continue;
      }

      const interest = getPhotosInterestFactor(slide, secondSlide);
      // console.warn('interest got', { interest, slideId, secondSlideId });

      if (interest > maximumInterest ) {
        maximumInterest = interest;
        maximumSecondSlideId = secondSlideId;
      }

      // if (interest >= 1) {
      //   maximumInterest = interest;
      //   maximumSecondSlideId = secondSlideId;
      //   break;
      // }
    }

    if (maximumSecondSlideId) {
      slidesHash[maximumSecondSlideId].isUsed = true;
      slidesHash[slideId].isUsed = true;
      result = [...result, slideId, maximumSecondSlideId];
    } else {
      slidesHash[slideId].isUsed = true;
      result = [...result, slideId];
    }

    // console.warn('max interest for', { slideId, maximumInterest, maximumSecondSlideId });
  }

  return result;
}




const afterDataGot = ({ photosCollection, photosCollectionHash }) => {
  console.log('got collection');
  console.log(photosCollection.length);

  // console.log('got hash', photosCollectionHash);

  let slides = [];

  let slidesHash = {};
  let isVerticalStarted = false;
  let verticalStartedId = null;

  for (let photo of photosCollection) {
    // HORIZONTAL
    if (photo.type === 'H') {
      const slide = [photo.id];
      slides.push(slide);
      slidesHash[photo.id] = { photoA: photo, isUsed: false, isSingle: true };
      continue;
    }

    // VERTICAL FULL
    if (isVerticalStarted && verticalStartedId) {
      const slide = [verticalStartedId, photo.id];
      slides.push(slide);

      slidesHash[`${verticalStartedId}-${photo.id}`] = {
        photoA: photosCollectionHash[verticalStartedId],
        photoB: photo,
        isUsed: false,
        isSingle: false,
      };

      isVerticalStarted = false;
      verticalStartedId = null;
      continue;
    }

    isVerticalStarted = true;
    verticalStartedId = photo.id;
  }

  console.log('slides got', slides.length);
  // return;
  // console.log('slidesHash got', slidesHash);

  const sortedSlides = getSortedSlides(slides, slidesHash);

  console.warn('sortedSlides got', sortedSlides.length);

  // return;

  prepareAndWriteSubmission(sortedSlides);
}




getData(INPUT_PATH).then(afterDataGot);
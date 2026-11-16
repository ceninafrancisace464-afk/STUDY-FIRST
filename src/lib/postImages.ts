
let selectedPostImages: string[] = [];

export const setPostImages = (images: string[]) => {
  selectedPostImages = images;
};

export const getPostImages = () => {
  return selectedPostImages;
};

export const clearPostImages = () => {
  selectedPostImages = [];
};

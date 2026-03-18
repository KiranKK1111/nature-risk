export const isContainerMode = () => {
  return localStorage.getItem("isContainer") || false;
};
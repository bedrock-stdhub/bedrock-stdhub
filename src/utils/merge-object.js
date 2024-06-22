export default function deepMerge(obj1, obj2) {
  const result = { ...obj1 };

  for (let key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      if (obj2[key] instanceof Object && obj1[key] instanceof Object) {
        result[key] = deepMerge(obj1[key], obj2[key]);
      } else {
        result[key] = obj2[key];
      }
    }
  }

  return result;
}
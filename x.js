import ShortUniqueId from 'short-unique-id';
const id = 'ff_' +(new ShortUniqueId({
  length: 40,
  dictionary: 'alphanum_lower',
})).rnd();
console.log('id', id);

// Utility to normalize a query for more tolerant comparison.
// normalize('@media (min-width: 1000px)') === normalize('@media(min-width:1000px)')

module.exports = function normalize(query) {
  return query.toLowerCase().replace(/\s/g, '');
}
const client = require('../src/contentfulClient');

client.getEntries({ content_type: 'team' })
  .then(response => {
    console.log('✅ Teams found:');
    response.items.forEach(item => {
      console.log('-', item.fields.name); // no ['en-US']
    });
  })
  .catch(err => {
    console.error('❌ Error fetching teams:', err);
  });


require('dotenv').config();
const contentful = require('contentful');

const client = contentful.createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_CDA_TOKEN
});

(async () => {
  try {
    const res = await client.getEntries({ content_type: 'team', include: 1 }); // include resolves links
    // Build a map of included assets by id (defensive in case SDK leaves any unresolved)
    const assets = {};
    (res.includes?.Asset || []).forEach(a => assets[a.sys.id] = a);

    console.log('Teams & logo URLs:');
    res.items.forEach(team => {
      const name = team.fields.name;
      let url = null;

      const logo = team.fields.logo;
      if (logo?.fields?.file?.url) {
        url = 'https:' + logo.fields.file.url;
      } else if (logo?.sys?.id && assets[logo.sys.id]?.fields?.file?.url) {
        url = 'https:' + assets[logo.sys.id].fields.file.url;
      }

      console.log('-', name, url ? url : '(no logo)');
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
})();


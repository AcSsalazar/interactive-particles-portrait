const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./common.js');

module.exports = merge(common, {
	mode: 'development',
	devtool: 'inline-source-map',
	devServer: {
		static: {
			directory: path.join(__dirname, '../static'), // ✅ Asegura la ruta correcta
			publicPath: '/static/', // ✅ Indica la URL en el navegador
		},
		
		
		host: '0.0.0.0', // Permite acceso desde otras máquinas
		port: 3000, // Puedes cambiarlo si el puerto está ocupado
		hot: true, // Habilita recarga en vivo sin refrescar toda la página
		open: true, // Abre el navegador automáticamente
	}
});

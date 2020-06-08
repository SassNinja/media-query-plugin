
import './example.scss';
import './example2.scss';

const resizeHandler = () => {
    if (window.innerWidth >= 960) {
        import(/* webpackChunkName: 'example-desktop' */ './example-desktop');
        window.removeEventListener('resize', resizeHandler);
    }
};

window.addEventListener('resize', resizeHandler);
resizeHandler();
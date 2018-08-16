
import './example.scss';
import './example2.scss';

if (window.innerWidth <= 960) {
    import(/* webpackChunkName: 'example-desktop' */ './example-desktop.scss');
}
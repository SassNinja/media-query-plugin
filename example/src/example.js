
import './example.scss';

if (window.innerWidth >= 960) {
    import(/* webpackChunkName: 'example-desktop' */ './example-desktop.scss');
}
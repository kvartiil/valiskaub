import { App } from 'solenya'
import { Master } from './ui/master'
import 'bootstrap'
import './logic/extensions'
import './site.scss'

const app = window["app"] = new App (Master, "app")
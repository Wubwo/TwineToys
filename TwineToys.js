const setCookie = (cname, cvalue, exdays) => {
  let d = new Date()
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000)
  let expires = 'expires=' + d.toUTCString()
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/'
}

const getCookie = (cname) => {
  let name = cname + '='
  let ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) == ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length)
    }
  }
  return ''
}

let enabled = false
let shockWarnings = true
let webhook = getCookie('twinetoys_webookid')
let dev = false
const valueTrackers = {}

const customCSS = `
#ui-bar-body {
  margin-top: 7.1em;
}

* { margin: revert; }
.ttpPanel {
  color: black;
  position: absolute;
  top: 2.2em;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
}

.ttpBrand {
  background-color: red;
  padding: 5px;
  background-color: #ff9999;
}

.ttpWarning {
  font-family: sans-serif;
  position: fixed; 
  z-index: 999;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgb(0,0,0);
  background-color: rgba(0,0,0,0.4);
}

.ttpWarningContent {
  font-family: sans-serif;
  background-color: #ff9999;
  color: black;
  margin: 5% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 40%;
  position: relative;
}

.ttpShockWarning {
  width: 21%;
  background-color: orange;
  text-align: center;
  font-weight: bold;
  color: black;
}

.ttpScriptInfoWrapper {
  text-align: center;
  width: 50%;
  margin: 0 auto;
}

.ttpScriptInfo {
  padding: 5px;
  border: 1px solid black;
  text-align: left;
  display: flex;
  flex-wrap: wrap;
}

.ttpScriptInfo span {
  margin: 4px 0px;
  flex: 0 0 50%;
}

.ttpScriptInfo span:nth-of-type(odd) {
  font-weight:bold;
}

.ttpScriptInfo {
  text-align: left;
  display: flex;
}

.ttpWarningButton {
  display: inline-block;
  background-color: #68d;
  padding: 10px;
  margin-right: 10px;
  border-radius:5px;
  color: white;
}

.ttpAgree:hover {
  color: white;
  background-color: green;
}

.tppCancel:hover, .ttpCloseMenu:hover {
  color: white;
  background-color: red;
}

.ttpCloseMenu {
  position: absolute;
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  left: calc(100% - 30px);
  top: 0;
  background-color: #68d;
  color: white;
}

#xtoys_webhook {
  min-width: 90%;
  width: 90%;
  text-align: center;
}
`

const disclaimer = ({
  scriptName,
  author,
  authorUrl,
  version,
  toySuggestions,
  shock,
}) => `\
<h2>TwineToys</h2>
<p>TwineToys has been initialized. That means you're running a TamperMonkey/Greasemonkey script to interact with <a href='https://xtoys.app/' target='_blank'>xtoys.app</a>, which will control your sex toys.</p>
<p>If you haven't yet setup your sex toys, <a href=''>click here for instructions</a>.</p>
<div class='ttpScriptInfoWrapper'/>
  <div class='ttpScriptInfo'>
    <span>Running:</span><span>${scriptName}</span>
    <span>By:</span><span><a href='${authorUrl}'/>${author}</a></span>
    <span>Version:</span><span>${version}</span>
    ${
      toySuggestions?.primary
        ? `<span>1st Toy Suggestion:</span><span>${toySuggestions.primary}</span>`
        : ''
    }
    ${
      toySuggestions?.secondary
        ? `<span>2nd Toy Suggestion:</span><span>${toySuggestions.secondary}</span>`
        : ''
    }
    ${shock ? '<span>Shock Collar:</span><span>True</span>' : ''}
  </div>
</div>
${
  shock
    ? `<p>The TwineToys Mod you're running has the ability to interact with a Shock Collar. If you don't have a Shock Collar installed, you have nothing to worry about. If you do, you probably already know that electricity is dangerous. <strong>You should <a target='_blank' href='https://twitter.com/BusterBDSM/status/1292957970742087680'>never put a Shock Collar around your neck</a>,</strong> we recommend wrapping it around your wrist, ankle, or "special place &#128540;" if you want to play more safely with electricity. But remember: <strong>electricity is dangerous.</strong></p>
  <p>We've added a "Shock Warnings" option so that you can always be informed if the script is about to shock you, but please understand that we don't take any responsibility for any errors that may result in you getting shocked unexpectedly, nor do we accept liability for any injury or hazard you put yourself in while using this script.</p>
  <p>Make sure you go to the <a href='https://xtoys.app/' target='_blank'>xtoys.app</a> setup page and set the shock power to a value you're comfortable with.</p>
  <p>If you understand the risks, have set up a comfortable shock level, click "I agree."</p>`
    : `<p>Please always make sure to play safe. We do not accept liability for any injury or hazard you put yourself in while using this script. If that's okay with you, click "I agree." Otherwise, click "Cancel" to completely disable this script.</p>`
}`

const testToysPanel = ({ shock }) => `\
<h2>TwineToys</h2>
<p>TwineToys has no ability to tell what toys you have set up. We can just send triggers to <a href='https://xtoys.app/' target='_blank'>xtoys.app</a>. You should configure the settings for all your toys there, including our connector script. For instructions, <a href=''>click here</a>.</p>
<a class='ttpWarningButton ttpAgree' id='ttpTestPrimary'>Buzz Primary Toy</a>
<a class='ttpWarningButton ttpAgree' id='ttpTestSecondary'>Buzz Secondary Toy</a>
${
  shock
    ? `<a class='ttpWarningButton ttpAgree' id='ttpTestShock'>Shock Collar</a>`
    : ''
}
<a class='ttpCloseMenu' id='ttpTestClose'>X</a>
`

/**
 * Sends a generic output to the primary and secondary toys the user has setup, expected to be vibration but you do you.
 * @param {Object} details The details for the intensity, timing, duration, pattern, and target of the output.
 * @param {string} details.toy Either "primary", "secondary", or "both"
 * @param {number} details.intensity Percentage strength of output.
 * @param {number} [details.duration] Time in seconds to pulse. Leave provide a pattern instead (eg. {pattern: 'steady'}) to run with no specified end.
 * @param {string} [details.pattern] One of: "steady", "waves", "toggle", "slow_increase_hold_at_max", "random_torment", "increase_then_reverse", "increase_then_drop"
 */
function TwineToysRequest({ toy, pattern, intensity, duration }) {
  if (!enabled)
    return console.error(
      "Something tried to call TwineToysRequest, but the user hasn't allowed TwineToys to run."
    )
  const url = new URL('https://xtoys.app/webhook')
  url.searchParams.append('id', webhook)
  url.searchParams.append('toy', toy)
  url.searchParams.append('action', duration ? 'pulse' : 'vibrate')
  url.searchParams.append('intensity', parseInt(intensity, 10))
  if (duration) url.searchParams.append('duration', parseInt(duration, 10))
  else if (pattern) url.searchParams.append('pattern', pattern)
  GM_xmlhttpRequest({ url: url.href, method: 'GET' })
}

/**
 * Sends a single shock with a given intensity to the Shock Collaruser has setup, and provides a warning if the user has not opted out of warnings.
 * @param {Object} shockDetails The settings for the intensity/vibration of the shock.
 * @param {number} shockDetails.intensity The strength of the output, between 1 and 15.
 * @param {boolean} shockDetails.vibrate Optionally vibrate the shock collar right before the shock.
 */
function TwineToysShock({ intensity, vibrate }) {
  if (!enabled)
    return console.error(
      "Something tried to call TwineToysShock, but the user hasn't allowed TwineToys to run."
    )
  const warningModal = document.createElement('div')
  if (shockWarnings) {
    warningModal.classList.add('ttpWarning')
    document.body.appendChild(warningModal)

    const warningModalContent = document.createElement('div')
    warningModalContent.classList.add('ttpWarningContent', 'ttpShockWarning')
    warningModal.appendChild(warningModalContent)
    warningModalContent.innerHTML =
      'Warning, your Shock Collar will shock you shortly.'
  }
  setTimeout(
    () => {
      const url = new URL('https://xtoys.app/webhook')
      url.searchParams.append('id', 'webhook')
      url.searchParams.append('intensity', parseInt(intensity, 10))
      url.searchParams.append('vibrate', vibrate ? 'true' : 'false')
      if (shockWarnings) warningModal.remove()
      GM_xmlhttpRequest({ url: url.href, method: 'GET' })
    },
    shockWarnings ? 5000 : 1
  )
}

/**
 * Resolves the path of an object (given as an array) to that object to find the value at that path. Helpful for finding the value of a changed path on the twine state.
 * @param {object} The object (presumably a twine state) we are deriving the path of.
 * @param {array} path The path of the variable in the object we are seeking, as an array. eg: obj.playerValues.health -> ['playerValues', 'health']
 */
function TwineToysResolvePath(obj, path) {
  let current = obj
  while (path.length) {
    if (typeof current !== 'object') return undefined
    current = current[path.shift()]
  }
  return current
}

/**
 * Returns the key-value object of current trackers.
 */
function TwineToysGetTrackers() {
  return valueTrackers
}

/**
 * Returns a specific tracker based on a given ID.
 * @param {string} uniqueId - The known uniqueId of a specific tracker.
 */
function TwineToysGetTracker(uniqueId) {
  return valueTrackers[uniqueId]
}

/**
 * Class representing a "tracker", which is an object whose purpose is to apply actions on specific changes to the twine state.
 * For example, one could set a tracker to listen for changes to a specific variable, with a given action function which is applied when
 * a given comparator's condition is met.
 */
class TwineToysTracker {
  /**
   * Create a tracker.
   * @param {Object} details The path, comparison function, and action function which this tracker applies.
   * @param {string} [details.uniqueId] The optional ID of this listener to reference with TwineToysGetTracker(uniqueId)
   * @param {array} details.path The path in the twine state we're focusing on changes for. eg: state.player.variables.hunger[0] -> ['state', 'player', 'variables', 'hunger', 0]
   * @param {function} details.comparatorFunction A function which returns true or false, and is passed the arguments { index, variableChanged, oldValue } to decide whether or not the tracker should apply its action function based on how the variable at the given path has changed.
   * @param {function} details.actionFunction A function which determines what the script should do when the path has changed and the comparatorFunction returns true. It is also passed { index, variableChanged, oldValue }.
   * @param {Object} [details.applyAction] An optional object to specify when the actionFunction should be applied, leave null for immediately.
   * @param {string} [details.applyAction.jQEvent] An optional jQuery event which will fire the actionFunction when the event is fired (after waiting applyAction.time).
   * @param {number} [details.applyAction.time] An optional amount of time to wait once the jQuery event occurs before firing the actionFunction.
   * @param {Objet} [details.selector] An optional object to specify an HTML element that should be interacted with for the action to fire.
   * @param {string} [details.selector.name] The jQuery selector, eg: '.className' to be searched for.
   * @param {boolean} [details.selector.highlight] Derermines whether or not the element should be visually highlighted as something to be interacted with.
   * @param {customCSS} [details.selector.customCSS] Overwrite the default TwineToys CSS for elements which are interacted with.
   */
  constructor({
    uniqueId,
    path,
    comparatorFunction,
    actionFunction,
    applyAction,
    selector,
  }) {
    this.uniqueId = uniqueId
    this.path = path
    this.comparatorFunction = comparatorFunction
    this.actionFunction = actionFunction
    this.applyAction = applyAction
    this.selector = selector
    this.tracking = false
    valueTrackers[
      uniqueId ||
        Math.random()
          .toString(36)
          .replace(/[^a-z]+/g, '')
          .substr(2, 10)
    ] = this
  }

  startTracking() {
    this.tracking = true
  }
  stopTracking() {
    this.tracking = false
  }
  getTracking() {
    return this.tracking
  }
  /**
   *
   * @param {Object} state The object passed by TamperTwine when the twine state changes, which contains information about the changed variables and old state.
   * @param {number} state.index The Twine history index of the current change.applyAction
   * @param {Object} state.changes The changed (updated, deleted, added) variables between the change and the old twine state.
   * @param {Object} state.oldState The old twine state at the previous index.
   */
  runCheck({ index, changes, oldState }) {
    // If a variable has changed which matches the path of the given variable
    const variableChanged = changes.find(
      (change) => JSON.stringify(change.path) === JSON.stringify(this.path)
    )
    if (!variableChanged) return
    // Perform the user's check function
    const newObject = {
      index,
      variableChanged,
      oldValue: TwineToysResolvePath(oldState, variableChanged.path),
    }
    if (
      this.comparatorFunction(newObject) && this.selector
        ? $(this.selector).length > 0
        : true
    ) {
      // Perform the user's action function
      // If we're looking for a slector to exist
      if (this.selector?.name) {
        const element = $(this.selector.name)
        if (element.length <= 0) return
        if (this.selector.highlight) {
          const css = this.selector.customCSS || {
            border: `4px dotted #ff9999ff`,
            padding: '8px',
            cursor: `${
              ['click', 'mousedown'].includes(this.applyAction?.jQEvent)
                ? 'pointer'
                : 'auto'
            }`,
          }
          element.css(css)
        }
        if (this.applyAction?.jQEvent) {
          // Add a listener to the given jq event
          element.on(this.applyAction?.jQEvent, () => {
            if (this.applyAction.time)
              setTimeout(
                () => this.actionFunction(newObject),
                this.applyAction.time
              )
            else this.actionFunction(newObject)
            element.off(this.applyAction?.jQEvent)
          })
        }
      } else {
        // If we're just checking the comparator, and don't care about selectors.
        if (this.applyAction?.time)
          setTimeout(
            () => this.actionFunction(newObject),
            this.applyAction.time
          )
        else this.actionFunction(newObject)
      }
    }
  }
}

/**
 *
 * @param {Object} modConfig The object which initialises the script with given config and registers a set of trackers which will fire when the Twine state changes in accordance with their settings.
 */
function TwineToysInitialise({ config, valueTrackers }) {
  if (enabled) return
  const uiBar = document.getElementById('ui-bar')
  if (!uiBar)
    return console.log(
      'TwineToys unable to append UI elements. This might not be a twine app, or may be too heavily modified.'
    )
  const styleSheet = document.createElement('style')
  styleSheet.innerText = customCSS.replace(/\n/g, '')
  document.head.appendChild(styleSheet)

  const warningModal = document.createElement('div')
  warningModal.classList.add('ttpWarning')
  document.body.appendChild(warningModal)

  const warningModalContent = document.createElement('div')
  warningModalContent.classList.add('ttpWarningContent')
  warningModal.appendChild(warningModalContent)
  warningModalContent.innerHTML = disclaimer(config)

  const agreeButton = document.createElement('a')
  agreeButton.classList.add('ttpWarningButton', 'ttpAgree')
  warningModalContent.appendChild(agreeButton)
  agreeButton.innerHTML = 'I agree'

  const cancelButton = document.createElement('a')
  cancelButton.classList.add('ttpWarningButton', 'tppCancel')
  warningModalContent.appendChild(cancelButton)
  cancelButton.innerHTML = 'Cancel'

  cancelButton.addEventListener('click', () => {
    warningModal.remove()
    document.getElementById('ui-bar-body').style.marginTop = '2.5em'
  })
  agreeButton.addEventListener('click', () => {
    if (enabled) return
    enabled = true
    const plugPanel = document.createElement('div')
    plugPanel.classList.add('ttpPanel')

    plugPanel.innerHTML = `
      <div class='ttpBrand'>TwineToys</div>
      <div class='ttpBrand'>
        <a href='https://xtoys.app/' target='_blank'>Control</a>&emsp;
        <a id='ttpTestBTN' href='#'>Test</a>
      </div>
      <div class='ttpBrand'><input id='xtoys_webhook' type='text' value='${webhook}' placeholder='xtoys.app webhook id'/>
      <div class='ttpBrand'><input id='shock_warnings' type='checkbox' checked />&emsp;<label for='shock_warnings'>Shock Warnings</label></div>
    `
    uiBar.insertBefore(plugPanel, document.getElementById('ui-bar-body'))
    warningModal.style.display = 'none'

    document
      .getElementById('shock_warnings')
      .addEventListener('change', ({ currentTarget: { checked } }) => {
        shockWarnings = checked
      })

    document
      .getElementById('xtoys_webhook')
      .addEventListener('change', ({ target: { value } }) => {
        webhook = encodeURIComponent(value)
        setCookie('twinetoys_webookid', value, 365)
      })

    // Convert the warning modal into the testing modal
    warningModalContent.innerHTML = testToysPanel(config)
    warningModalContent.style.width = '25%'

    document.getElementById('ttpTestBTN').addEventListener('click', () => {
      warningModal.style.display = 'inline'
    })

    document.getElementById('ttpTestClose').addEventListener('click', () => {
      warningModal.style.display = 'none'
    })

    document.getElementById('ttpTestPrimary').addEventListener('click', () => {
      TwineToysRequest({ toy: 'primary', duration: 1, intensity: 100 })
    })

    document
      .getElementById('ttpTestSecondary')
      .addEventListener('click', () => {
        TwineToysRequest({ toy: 'secondary', duration: 1, intensity: 100 })
      })

    document.getElementById('ttpTestShock').addEventListener('click', () => {
      TwineToysShock({ intensity: 15, vibrate: true })
    })

    dev = config.dev
    valueTrackers.forEach((configuredTracker) =>
      new TwineToysTracker(configuredTracker).startTracking()
    )
  })
}

(() => {
  // When TamperTwine detects a change to the twine state.
  window.addEventListener('TwineChange', ({ detail }) => {
    if (dev) console.log(detail)
    // Pass the changes to all preconfigured trackers
    Object.values(valueTrackers).forEach((tracker) => {
      if (!tracker.tracking) return
      tracker.runCheck(detail)
    })
  })
})();
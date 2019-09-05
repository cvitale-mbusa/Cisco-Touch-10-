const xapi = require('xapi');

// vmr call management
var vmrCallWaiting = false;
var vmrNumber = "912017308000";
var conferenceId = "";
var confIdTimeout = 5 * 1000;

// central dispatcher - every panel "pl" button press triggers this
xapi.event.on('UserInterface Extensions Panel Clicked', resp => {
  // There are no more panels. As of CE9.3
  // a button can be created that is not associated with a panel.
  switch (resp.PanelId) {
    case "pl_videoconference":
      displayVideoConference();
      break;
  }
});

xapi.event.on('UserInterface Extensions Widget Action', resp => {
	if (resp.Type == "clicked") {
		// We've got a call type. Figure out which one and display the appropriate prompt.
		switch (resp.WidgetId) {
			// audio call types
			case "btn_internalcall":
			xapi.command('UserInterface Message TextInput Display',
		{ Title: "Place a 4 Digit Call", Text: "Type the extension you wish to call. Then press Dial.", FeedbackId: "internalcall_fb", InputType: "Numeric", Placeholder: "Enter the extension here (example: 2500)", SubmitText: "Dial" });
			break;
			case "btn_nationalcall":
			xapi.command('UserInterface Message TextInput Display',
		{ Title: "Place a National Call", Text: "Type the number you wish to call. Then press Dial.", FeedbackId: "nationalcall_fb", InputType: "Numeric", Placeholder: "Enter the number here (example: 9-1-770-555-XXXX)", SubmitText: "Dial" });
			break;
			case "btn_internationalcall":
			xapi.command('UserInterface Message TextInput Display',
		{ Title: "Place an International Call", Text: "Type the number you wish to call. Then press Dial.", FeedbackId: "internationalcall_fb", InputType: "Numeric", Placeholder: "Enter the call information here (example: 9011 49 711 17 xxxxx)", SubmitText: "Dial" });
			break;
			case "btn_vmrcall":
			xapi.command('UserInterface Message TextInput Display',
		{ Title: "VMR Call", Text: "Please enter VMR conference ID or e164 number", FeedbackId: "vmrconference_fb", InputType: "SingleLine", Placeholder: "Example: 872020289 or 1770555XXXX", SubmitText: "Dial" });
			break;
			// skype call types
			case "btn_skypeuser":
			xapi.command('UserInterface Message TextInput Display',
		{ Title: "Call a Skype User", Text: "Please enter an email address: Joe.Doe@Daimler.com / Joe.Doe@MBUSA.com", FeedbackId: "skypeuser_fb", InputType: "SingleLine", Placeholder: "Joe.Doe@Daimler.com / Joe.Doe@MBUSA.com", SubmitText: "Dial" });
			break;
			case "btn_skypeconference":
			xapi.command('UserInterface Message TextInput Display',
		{ Title: "Skype Conference ID Call", Text: "Please enter your Conference ID @Daimler.com", FeedbackId: "skypeconference_fb", InputType: "SingleLine", Placeholder: "Example: 123456@Daimler.com", SubmitText: "Dial" });
			break;
		}
	}
});

xapi.event.on('UserInterface Message TextInput Response', resp => {
	// Dial Selection Dispatch
	// Audio/Video Conference - Dial the number as given.
	// Skype Conference - Dial into the Skype bridge and
	// handle id's, passcodes, etc.
	console.log("Received feedback with id: " + resp.FeedbackId);
	console.log("resp.Text would be dialed now: " + resp.Text);
	switch (resp.FeedbackId) {
		case "internalcall_fb":
		xapi.command('dial', { Number: resp.Text });
		break;
		case "nationalcall_fb":
		xapi.command('dial', { Number: resp.Text });
		break;
		case "internationalcall_fb":
		if (resp.Text.startsWith("9011"))
			xapi.command('dial', { Number: resp.Text });
		else
			xapi.command('dial', { Number: '9011' + resp.Text });
		break;
		case "videoconference_fb": // video vmr - dial conference directly
		/*vmrCallWaiting = true;
		conferenceId = resp.Text;*/
		xapi.command('dial', { Number: resp.Text });
		break;
		case "vmrconference_fb": // audio vmr - dial the bridge
		vmrCallWaiting = true;
		conferenceId = resp.Text;
		xapi.command('dial', { Number: vmrNumber });
		break;
		case "skypeuser_fb":
		xapi.command('dial', { Number: resp.Text });
		break;
		case "skypeconference_fb":
		if (resp.Text.toLocaleLowerCase().endsWith("@daimler.com"))
			xapi.command('dial', { Number: resp.Text });
		else
			xapi.command('dial', { Number: resp.Text + "@Daimler.com" });
		break;
	}
});

xapi.status.on('SystemUnit State NumberOfActiveCalls', resp => {
	console.log('Received NumberOfActiveCalls: ' + resp);
	// send conference id via dtmf
	if (vmrCallWaiting) {
		vmrCallWaiting = false;
		setTimeout(() => xapi.command('Call DTMFSend', { DTMFString: conferenceId } ), confIdTimeout);
	}

	// display beginning of call instructions
	if (resp == 1)
		xapi.command('UserInterface Message Alert Display', { Title: "You can add a call or share content", Text: "Touch the \"Add\" button to add a call.<br>Touch the \"Share\" button to share content."});
});

function displayVideoConference() {
	xapi.command('UserInterface Message TextInput Display',
		{ Title: "Video Call", Text: "Please enter VMR conference ID or e164 number", FeedbackId: "videoconference_fb", InputType: "SingleLine", Placeholder: "Example: 872020289 or 1770555XXXX", SubmitText: "Dial" });
}
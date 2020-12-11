
while (true) {

    let userName = window.prompt("お好きなユーザー名を入力してください\n何も入力しない場合は、自動で決まります。", "");
    if (!userName || !userName.trim()) {
        let randomNumber = Math.round(Math.random() * 1000) % 1000;
        userName = "Beenos" + randomNumber.toString();
    }
    if (window.confirm("こちらのお名前でよろしいですか？\n" + userName)) {
        var id = Math.random().toString(32).substring(2);
        document.getElementById('userId').value = id;
        document.getElementById('name').value = userName;
        break;
    }
}

window.onbeforeunload = function () {
    firebase.database().ref('users/' + id).remove();
}
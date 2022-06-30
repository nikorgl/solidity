#### [English](https://github.com/nikorgl/solidity/tree/main/5_bridge) Русский

# Пример реализации кросс-чейн моста

## Задание
Написать контракт кроссчейн моста для отправки токенов стандарта ERC-20 между сетями Ethereum и Binance Smart chain.
- Написать контракт Bridge
- Написать полноценные тесты к контракту
- Написать скрипт деплоя
- Задеплоить в тестовую сеть
- Написать таск на swap, redeem
- Верифицировать контракт

Требования
- Функция swap(): списывает токены с пользователя и испускает event ‘swapInitialized’
- Функция redeem(): вызывает функцию ecrecover и восстанавливает по хэшированному сообщению и сигнатуре адрес валидатора, если адрес совпадает с адресом указанным на контракте моста то пользователю отправляются токены


## Информация о развернутых контрактах

## Сторона Rinkeby
### ERC-20 contract
https://rinkeby.etherscan.io/address/0xf57B91D2C402D41fE77cbc48CE5AB52A34e542E9
### Bridge contract
https://rinkeby.etherscan.io/address/0xDbE4939886DFeeCD432887aC1011E1Dd2892cAD0


## Сторона BSC
### ERC-20 contract
https://testnet.bscscan.com/address/0xD5c115456F405323114Af033048aB026be8ef58a
### Bridge contract
https://testnet.bscscan.com/address/0xA9C1D6B4940EAaF78f7a7fDB90387487D8ABEC0D


## Информация о передаче из Rinkeby в BSC Testnet:
### Swap in Rinkeby
https://rinkeby.etherscan.io/tx/0x4674bfebb98b65b27b015b41dc3229518268ad7948b17d81c695f3d0bc5482b9
### Redeem in BSC Testnet
https://testnet.bscscan.com/tx/0xfee5db5c0b7c74925dd8304fa8fdc3d526868e22b899cbe07831b51aaa6ae9be



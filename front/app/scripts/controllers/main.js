'use strict';

/**
 * @ngdoc function
 * @name BabarApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the BabarApp
 */
angular.module('BabarApp')
.controller('MainCtrl', function ($scope, $mdDialog, $mdToast, API) {
	var now = new Date();
	var currentSchoolYear = (now.getMonth() + 1) > 6 ? now.getFullYear() + 1 : now.getFullYear();
	var getRelativeYear = function(customer) {
		return 3 + -1*(customer.year - currentSchoolYear);
	};
	var getFullName = function(customer) {
		return customer.firstname + ' (' + customer.nickname + ') ' + customer.lastname;
	};
	API.getCustomer().then(function(res) {
		$scope.main.customers = res.data
		.map(function(customer) {
			customer.fullname = getFullName(customer);
			return customer;
		});
	});
	this.unsetCustomer = function() {
		this.customerSearchText = '';
		this.customer = undefined;
	};
	this.setCustomer = function(pk) {
		if(pk) {
			API.getCustomer(pk).then(function(res) {
				var customer = res.data;
				customer.fullname = getFullName(customer);
				customer.relativeYear = getRelativeYear(customer);
				$scope.main.customer = res.data;
			});
		}
		else {
			this.unsetCustomer();
		}
	};
	this.reloadCustomer = function() {
		this.setCustomer($scope.main.customer.pk);
	};

	API.getProduct().then(function(res) {
		$scope.main.products = res.data;
	});
	this.unsetProduct = function() {
		this.productSearchText = '';
		this.product = undefined;
	};
	this.setProduct = function(pk) {
		if(pk) {
			API.getProduct(pk).then(function(res) {
				$scope.main.product = res.data;
				$scope.main.product.quantity = 1;
			});
		}
		else {
			this.unsetProduct();
		}
	};
	this.reloadProduct = function() {
		this.setProduct($scope.main.product.pk);
	};

	var onError = function(res) {
		if(res !== undefined) {
			var msg = 'Error: ' + res.status.toString() + ', ' + res.statusText;
			// Fuzzy-search for a more explicit error message
			if(res.data !== undefined) {
				for(var key in res.data) {
					if(key.indexOf('error') !== -1) {
						msg = 'Error: ' + res.data[key][0];
						break;
					}
				}
			}
			$mdToast.showSimple(msg);
		}
	};
	var onCancel = function() {
		// User cancelled
		$mdToast.showSimple('Cancelled');
	};

	this.makePurchase = function() {
		var confirm = $mdDialog.confirm({
			title: 'Make the purchase?',
			textContent: $scope.main.customer.nickname + ': ' + $scope.main.product.name + ' x' + $scope.main.product.quantity,
			ok: 'Yes',
			cancel: 'No',
		});
		$mdDialog.show(confirm).then(function() {
			var n = 1;
			if($scope.main.product.quantity)
				n = $scope.main.product.quantity;
			var i = 0;
			var func_ok = function() {
				i += 1;
				if(i == n) {
					$scope.main.unsetProduct();
					$scope.main.reloadCustomer();
					$mdToast.showSimple('Purchased');
				} else {
					API.postPurchase(
						$scope.main.customer.pk,
						$scope.main.product.pk
					).then(func_ok, function(res) {
						onError(res);
						$scope.main.unsetProduct();
						$scope.main.reloadCustomer();
					});
				}
			}
			API.postPurchase(
				$scope.main.customer.pk,
				$scope.main.product.pk
			).then(func_ok, function(res) {
				onError(res);
				$scope.main.unsetProduct();
				$scope.main.reloadCustomer();
			});
		}, function() {
			onCancel();
		});
	};

	this.paymentIsOpen = false;
	this.makePayment = function() {
		var confirm = $mdDialog.confirm({
			title: 'Make the payment?',
			textContent: $scope.main.customer.nickname + ': ' + $scope.main.paymentAmount + ' €',
			ok: 'Yes',
			cancel: 'No',
		});
		$mdDialog.show(confirm).then(function() {
			API.postPayment(
				$scope.main.customer.pk,
				$scope.main.paymentAmount
			).then(function() {
				// OK
				$scope.main.paymentIsOpen = false;
				$scope.main.reloadCustomer();
				$mdToast.showSimple('Payed');
			}, function(res) {
				onError(res);
			});
		}, function() {
			onCancel();
		});
	};
});

'use strict';

/* global alert, Vue, $, injectedData */

Vue.component('wicked-default-product-group', {
    props: ['value', 'productGroups'],
    template: `
    <div>
        <p> Product Groups </p>
        <wicked-product-group-picker :productGroups="productGroups" :include-none=true />
    </div>
    `
});

Vue.component('wicked-product-groups', {
    props: ['value'],
    data: function () {
        return {
            selectedIndex: 0
        };
    },
    methods: {
        isSelected: function (index) {
            return index === this.selectedIndex;
        },
        selectBs: function (index) {
            this.selectedIndex = index; 
        },
        isValidsegmentId: function (segmentId) {
            return /^[a-z0-9_-]+$/.test(segmentId);
        },
        addBs: function () {
            this.value.product_groups.push({
                id: "new_product_group",
                name: "New Product Group",
            });
            this.selectedIndex = this.value.product_groups.length - 1;
        },
        deleteBs: function (groupIndex) {
            if (groupIndex >= this.value.product_groups.length - 1)
                this.selectedIndex = this.value.product_groups.length - 2;
            this.value.product_groups.splice(groupIndex, 1);
        }
    },
    template: `
    <div class="row">
        <div class="col-md-4">
            <wicked-panel type="primary" :collapsible=false title="Group List">
                <div v-for="(bs, index) in value.product_groups">
                    <div class="btn-group btn-group-justified" style="width:100%">
                        <a role="button" v-on:click="selectBs(index)" style="width:85%" :class="{ btn: true, 'btn-lg': true, 'btn-primary': isSelected(index), 'btn-default': !isSelected(index) }">{{ bs.name }} ({{ bs.id }})</a>
                        <a v-if="bs.id !== 'clarivate'" role="button" v-on:click="deleteBs(index)" style="width:15%" class="btn btn-lg btn-danger"><span class="glyphicon glyphicon-remove"></span></a>
                    </div>
                    <div style="height:10px"></div>
                </div>
                <a role="button" v-on:click="addBs" class="btn btn-lg btn-success"><span class="glyphicon glyphicon-plus"></span></a>
            </wicked-panel>
        </div>
        <div class="col-md-8">
            <wicked-panel type="primary" :collapsible=false :title="value.product_groups[selectedIndex].name">
                <wicked-input v-model="value.product_groups[selectedIndex].id" :readonly="value.product_groups[selectedIndex].id === 'admin'" label="Group ID:" hint="Must only contain a-z, 0-9, - and _ characters." />
                <p v-if="!isValidsegmentId(value.product_groups[selectedIndex].id)" class="wicked-note" style="color:red">The Product Group ID is not valid.</p>
                <wicked-input v-model="value.product_groups[selectedIndex].name" label="Product Group Name:" />

                <p class="wicked-note">< Define 'Product Group' here ></p>
                <p v-if="value.product_groups[selectedIndex].id === 'clarivate'" class="wicked-note"><b>Note:</b> The <code>clarivate</code> group cannot be renamed or deleted. </p>
            </wicked-panel>
        </div>
    </div>
    `
});


// ==============================================================

const vm = new Vue({
    el: '#vueBase',
    data: injectedData
});

function storeData() {
    $.post({
        url: `/productGroups/api`,
        data: JSON.stringify(vm.$data),
        contentType: 'application/json'
    }).fail(function () {
        alert('Could not store data, an error occurred.');
    }).done(function () {
        alert('Successfully stored data.');
    });
}

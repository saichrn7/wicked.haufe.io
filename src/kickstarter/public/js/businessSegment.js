'use strict';

/* global alert, Vue, $, injectedData */

Vue.component('wicked-default-business-segment', {
    props: ['value', 'businessSegments'],
    template: `
    <div>
        <p> Business Segments </p>
        <wicked-business-segment-picker :businessSegments="businessSegments" :include-none=true />
    </div>
    `
});

Vue.component('wicked-business-segments', {
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
            this.value.business_segments.push({
                id: "new_business_segment",
                name: "New Business Segment"
            });
            this.selectedIndex = this.value.business_segments.length - 1;
        },
        deleteBs: function (groupIndex) {
            if (groupIndex >= this.value.business_segments.length - 1)
                this.selectedIndex = this.value.business_segments.length - 2;
            this.value.business_segments.splice(groupIndex, 1);
        }
    },
    template: `
    <div class="row">
        <div class="col-md-4">
            <wicked-panel type="primary" :collapsible=false title="Segment List">
                <div v-for="(bs, index) in value.business_segments">
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
            <wicked-panel type="primary" :collapsible=false :title="value.business_segments[selectedIndex].name">
                <wicked-input v-model="value.business_segments[selectedIndex].id" :readonly="value.business_segments[selectedIndex].id === 'admin'" label="Segment ID:" hint="Must only contain a-z, 0-9, - and _ characters." />
                <p v-if="!isValidsegmentId(value.business_segments[selectedIndex].id)" class="wicked-note" style="color:red">The Business Segment ID is not valid.</p>
                <wicked-input v-model="value.business_segments[selectedIndex].name" label="Segment Name:" />

                <p class="wicked-note">< Define 'busines segment' here ></p>
                <p v-if="value.business_segments[selectedIndex].id === 'clarivate'" class="wicked-note"><b>Note:</b> The <code>clarivate</code> segment cannot be renamed or deleted. </p>
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
        url: `/businessSegments/api`,
        data: JSON.stringify(vm.$data),
        contentType: 'application/json'
    }).fail(function () {
        alert('Could not store data, an error occurred.');
    }).done(function () {
        alert('Successfully stored data.');
    });
}
